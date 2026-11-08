import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  UnauthorizedAdminError,
  verifySingleAdminAuthorization,
  type VerifiedAdminContext,
} from "@/lib/auth/admin-guard";
import {
  buildCacheRevalidationPlan,
  executeCacheRevalidation,
} from "@/lib/cache/revalidation";
import { INITIAL_PROJECTS } from "@/lib/database/fixtures";
import { SupabasePortfolioRepository, getPortfolioRepository } from "@/lib/database/repository";
import {
  SupabaseConfigurationError,
  SupabaseConnectionError,
} from "@/lib/supabase/errors";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import {
  projectDraftSchema,
  projectPublishValidationSchema,
  validateMediaUpload,
} from "@/lib/validations/cms";
import {
  ContentPublishingEngine,
  type AuditLogEntry,
  type PublicationRecord,
  type PublishingStoreAdapter,
  type RevisionRecord,
  type VersionedEntityRecord,
} from "@/features/publishing/publishing-engine";
import type { PublishableEntityType } from "@/types/database";
import type { ProjectDetail } from "@/types/portfolio";

class InMemoryPublishingStore<T> implements PublishingStoreAdapter<T> {
  public entities = new Map<string, VersionedEntityRecord<T>>();
  public revisions: RevisionRecord<T>[] = [];
  public publications: PublicationRecord[] = [];
  public auditLogs: AuditLogEntry[] = [];

  private key(entityType: PublishableEntityType, entityId: string) {
    return `${entityType}:${entityId}`;
  }

  async getEntity(
    entityType: PublishableEntityType,
    entityId: string,
  ): Promise<VersionedEntityRecord<T> | null> {
    return this.entities.get(this.key(entityType, entityId)) ?? null;
  }

  async saveEntity(record: VersionedEntityRecord<T>): Promise<void> {
    this.entities.set(
      this.key(record.entityType, record.entityId),
      structuredClone(record),
    );
  }

  async getRevisions(
    entityType: PublishableEntityType,
    entityId: string,
  ): Promise<RevisionRecord<T>[]> {
    return this.revisions.filter(
      (r) => r.entityType === entityType && r.entityId === entityId,
    );
  }

  async appendRevision(revision: RevisionRecord<T>): Promise<void> {
    this.revisions.push(structuredClone(revision));
  }

  async appendPublication(publication: PublicationRecord): Promise<void> {
    this.publications.push(structuredClone(publication));
  }

  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    this.auditLogs.push(structuredClone(entry));
  }
}

const VERIFIED_ADMIN: VerifiedAdminContext = {
  adminId: "00000000-0000-4000-8000-000000000001",
  authUserId: "00000000-0000-4000-8000-000000000099",
  email: "admin@example.com",
  role: "admin",
};

describe("Sprint 3 — Backend, RLS Schema, Auth Guard, Storage & Publishing Engine", () => {
  it("enforces single-admin authorization and rejects unauthenticated or non-admin users", async () => {
    // 1. Unauthenticated user -> 401
    await expect(
      verifySingleAdminAuthorization({
        getAuthenticatedUser: async () => null,
        findAdminRecord: async () => null,
      }),
    ).rejects.toThrow(UnauthorizedAdminError);

    // 2. Authenticated user not in admin_users allowlist -> 403
    await expect(
      verifySingleAdminAuthorization({
        getAuthenticatedUser: async () => ({
          id: "intruder-id",
          email: "intruder@example.com",
        }),
        findAdminRecord: async () => null,
      }),
    ).rejects.toThrow(/not an authorized administrator/);

    // 3. Inactive admin record -> 403
    await expect(
      verifySingleAdminAuthorization({
        getAuthenticatedUser: async () => ({
          id: VERIFIED_ADMIN.authUserId,
          email: VERIFIED_ADMIN.email,
        }),
        findAdminRecord: async () => ({
          id: VERIFIED_ADMIN.adminId,
          auth_user_id: VERIFIED_ADMIN.authUserId,
          email: VERIFIED_ADMIN.email,
          role: "admin",
          is_active: false,
        }),
      }),
    ).rejects.toThrow(/not an authorized administrator/);

    // 4. Valid active single admin -> resolves VerifiedAdminContext
    const verified = await verifySingleAdminAuthorization({
      getAuthenticatedUser: async () => ({
        id: VERIFIED_ADMIN.authUserId,
        email: VERIFIED_ADMIN.email,
      }),
      findAdminRecord: async () => ({
        id: VERIFIED_ADMIN.adminId,
        auth_user_id: VERIFIED_ADMIN.authUserId,
        email: VERIFIED_ADMIN.email,
        role: "admin",
        is_active: true,
      }),
    });

    expect(verified).toEqual(VERIFIED_ADMIN);
  });

  it("blocks createSupabaseServiceRoleClient when invoked in a browser-like environment", () => {
    // In Vitest jsdom environment, window is defined, so calling createSupabaseServiceRoleClient must throw immediately
    expect(() => createSupabaseServiceRoleClient()).toThrow(
      /Security violation: createSupabaseServiceRoleClient must never be invoked in a browser context/,
    );
  });

  it("executes Draft -> Preview -> Publish workflow while preserving published content on draft edits or failed publish", async () => {
    const store = new InMemoryPublishingStore<ProjectDetail>();
    const invalidatedPaths: string[] = [];
    const invalidatedTags: string[] = [];

    const engine = new ContentPublishingEngine<ProjectDetail>(
      store,
      (draft) => projectDraftSchema.parse(draft),
      (pub) => projectPublishValidationSchema.parse(pub),
      {
        revalidatePath: (p) => invalidatedPaths.push(p),
        revalidateTag: (t) => invalidatedTags.push(t),
      },
    );

    const baseProject: ProjectDetail = {
      ...INITIAL_PROJECTS[0]!,
      id: "proj-geo-1",
      slug: "geoentity",
    };

    // Step 1: Save initial draft
    const draft1 = await engine.saveDraft({
      admin: VERIFIED_ADMIN,
      entityType: "project",
      entityId: baseProject.id,
      slug: baseProject.slug,
      draftPayload: baseProject,
      changeSummary: "Initial draft",
    });

    expect(draft1.entity.status).toBe("draft");
    expect(draft1.entity.publishedData).toBeNull();

    // Public query must return null while in draft
    expect(
      await engine.getPublicPublished({
        entityType: "project",
        entityId: baseProject.id,
      }),
    ).toBeNull();

    // Unauthenticated preview must be rejected
    await expect(
      engine.previewDraft({
        admin: null,
        entityType: "project",
        entityId: baseProject.id,
      }),
    ).rejects.toThrow(/Unauthorized preview request/);

    // Authenticated admin can preview draft
    const preview = await engine.previewDraft({
      admin: VERIFIED_ADMIN,
      entityType: "project",
      entityId: baseProject.id,
    });
    expect(preview.mode).toBe("preview");
    expect(preview.draftData.name).toBe("GeoEntity");
    expect(preview.currentlyPublishedData).toBeNull();

    // Step 2: Publish draft v1
    const published1 = await engine.publishDraft({
      admin: VERIFIED_ADMIN,
      entityType: "project",
      entityId: baseProject.id,
      changeSummary: "Publish v1",
    });

    expect(published1.entity.status).toBe("published");
    expect(published1.revalidation.paths).toContain("/");
    expect(invalidatedPaths).toContain("/");
    expect(invalidatedTags).toContain("project:geoentity");

    const liveAfterPublish = await engine.getPublicPublished({
      entityType: "project",
      entityId: baseProject.id,
    });
    expect(liveAfterPublish?.description).toBe(baseProject.description);

    // Step 3: Save a new draft edit (v3) -> live publishedData must remain unchanged!
    const editedDraftPayload: ProjectDetail = {
      ...baseProject,
      description: "Unpublished working draft description v2.",
    };
    await engine.saveDraft({
      admin: VERIFIED_ADMIN,
      entityType: "project",
      entityId: baseProject.id,
      slug: baseProject.slug,
      draftPayload: editedDraftPayload,
      changeSummary: "Draft edit v2",
    });

    const liveDuringDraftEdit = await engine.getPublicPublished({
      entityType: "project",
      entityId: baseProject.id,
    });
    expect(liveDuringDraftEdit?.description).toBe(baseProject.description);

    // Step 4: Attempt to publish an incomplete draft (empty case study sections) -> must fail and preserve previous published version
    const incompleteDraftPayload: ProjectDetail = {
      ...editedDraftPayload,
      caseStudySections: [],
    };
    await engine.saveDraft({
      admin: VERIFIED_ADMIN,
      entityType: "project",
      entityId: baseProject.id,
      slug: baseProject.slug,
      draftPayload: incompleteDraftPayload,
      changeSummary: "Incomplete draft without sections",
    });

    await expect(
      engine.publishDraft({
        admin: VERIFIED_ADMIN,
        entityType: "project",
        entityId: baseProject.id,
      }),
    ).rejects.toThrow(/Cannot publish project/);

    const liveAfterFailedPublish = await engine.getPublicPublished({
      entityType: "project",
      entityId: baseProject.id,
    });
    expect(liveAfterFailedPublish?.description).toBe(baseProject.description);

    // Step 5: Archive project -> removes from public view and revalidates cache
    await engine.transitionPublicationState({
      admin: VERIFIED_ADMIN,
      entityType: "project",
      entityId: baseProject.id,
      targetState: "archived",
    });
    expect(
      await engine.getPublicPublished({
        entityType: "project",
        entityId: baseProject.id,
      }),
    ).toBeNull();
  });

  it("validates storage uploads strictly by bucket, MIME type, file extension, size limit, and path traversal safety", () => {
    // Valid PDF resume upload -> defaults to isPublic: false
    const resumeUpload = validateMediaUpload({
      bucket: "resume",
      fileName: "Muhamad_Fauzan_CV_2026.pdf",
      mimeType: "application/pdf",
      sizeBytes: 420_000,
    });
    expect(resumeUpload.isPublic).toBe(false);
    expect(resumeUpload.storagePath).toBe("resume/muhamad_fauzan_cv_2026.pdf");

    // Rejects mismatched MIME type vs extension (e.g. executable disguised or HTML)
    expect(() =>
      validateMediaUpload({
        bucket: "profile",
        fileName: "avatar.png",
        mimeType: "text/html",
        sizeBytes: 1024,
      }),
    ).toThrow(/MIME type "text\/html" is not allowed/);

    // Rejects image uploaded to PDF-only resume bucket
    expect(() =>
      validateMediaUpload({
        bucket: "resume",
        fileName: "resume.png",
        mimeType: "image/png",
        sizeBytes: 1024,
      }),
    ).toThrow(/not allowed in bucket "resume"/);

    // Rejects oversized file (> 5 MB for profile bucket)
    expect(() =>
      validateMediaUpload({
        bucket: "profile",
        fileName: "large.webp",
        mimeType: "image/webp",
        sizeBytes: 6 * 1024 * 1024,
      }),
    ).toThrow(/exceeds bucket limit/);

    // Rejects path traversal attempts
    expect(() =>
      validateMediaUpload({
        bucket: "projects",
        fileName: "../secrets.png",
        mimeType: "image/png",
        sizeBytes: 2048,
      }),
    ).toThrow(/invalid or unsafe file name/);
  });

  it("distinguishes SupabaseConfigurationError from SupabaseConnectionError and never falls back silently", async () => {
    const repo = getPortfolioRepository("supabase");
    expect(repo).toBeInstanceOf(SupabasePortfolioRepository);

    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      // Missing credentials -> SupabaseConfigurationError
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      await expect(repo.getPublicPortfolioBundle()).rejects.toBeInstanceOf(
        SupabaseConfigurationError,
      );

      // Unreachable endpoint or failed database query -> SupabaseConnectionError
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.sig";
      const offlineRepo = new SupabasePortfolioRepository(() => {
        return {
          from() {
            throw new Error("ECONNREFUSED: database connection failed");
          },
        } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
      });
      await expect(offlineRepo.getPublicPortfolioBundle()).rejects.toBeInstanceOf(
        SupabaseConnectionError,
      );
    } finally {
      if (prevUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
      else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (prevKey !== undefined) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevKey;
      else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  });

  it("verifies SQL migrations and seed.sql enforce RLS on all 19 tables and keep GeoEntity, ClayCV, and SPK Bansos SAW in draft", () => {
    const schemaSql = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/00001_initial_schema.sql"),
      "utf8",
    );
    const rlsSql = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/00002_rls_and_storage_policies.sql",
      ),
      "utf8",
    );
    const seedSql = fs.readFileSync(
      path.join(process.cwd(), "supabase/seed.sql"),
      "utf8",
    );

    const expectedTables = [
      "admin_users",
      "content_revisions",
      "content_publications",
      "audit_logs",
      "singleton_configs",
      "profiles",
      "site_settings",
      "hero_contents",
      "about_contents",
      "skill_categories",
      "skills",
      "media_assets",
      "resume_files",
      "projects",
      "project_technologies",
      "project_sections",
      "experiences",
      "educations",
      "certifications",
      "notes",
      "boot_greetings",
    ];

    for (const table of expectedTables) {
      expect(schemaSql).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(rlsSql).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`,
      );
    }

    // Verify seed.sql keeps all 3 initial projects as draft with NULL published_data
    expect(seedSql).toContain("'geoentity'");
    expect(seedSql).toContain("'claycv'");
    expect(seedSql).toContain("'spk-bansos-saw'");
    expect(seedSql).not.toMatch(/'geoentity'[\s\S]{0,120}'published'/);
    expect(seedSql).not.toMatch(/'claycv'[\s\S]{0,120}'published'/);
    expect(seedSql).not.toMatch(/'spk-bansos-saw'[\s\S]{0,120}'published'/);

    // Verify cache revalidation helper covers paths and tags
    const plan = buildCacheRevalidationPlan({
      entityType: "project",
      slug: "geoentity",
    });
    const executed: string[] = [];
    executeCacheRevalidation(plan, {
      revalidatePath: (p) => executed.push(`path:${p}`),
      revalidateTag: (t) => executed.push(`tag:${t}`),
    });
    expect(executed).toContain("path:/");
    expect(executed).toContain("tag:project:geoentity");
  });
});
