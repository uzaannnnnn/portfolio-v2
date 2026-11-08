import { beforeEach, describe, expect, it } from "vitest";
import { UnauthorizedAdminError } from "@/lib/auth/admin-guard";
import {
  authenticateSingleAdminCredentials,
  createSignedAdminSessionToken,
  verifySignedAdminSessionToken,
} from "@/lib/auth/session";
import {
  cmsEngines,
  deleteBootGreetingFromStore,
  deleteMediaAssetFromStore,
  getAdminDashboardSnapshot,
  getCmsStore,
  registerMediaAssetInStore,
  saveBootGreetingInStore,
  saveSkillCategoryInStore,
  setActivePublishedResumeInStore,
  uploadResumeVersionToStore,
} from "@/lib/database/cms-store";
import { FixturePortfolioRepository } from "@/lib/database/repository";
import { SupabasePublishingStore } from "@/lib/database/supabase-cms-store";

const TEST_ADMIN = {
  adminId: "00000000-0000-4000-8000-000000000001",
  authUserId: "00000000-0000-4000-8000-000000000099",
  email: "admin@muhamadfauzan.dev",
  role: "admin" as const,
};

describe("Sprint 4 — Admin Authentication, CMS CRUD, Draft/Preview/Publish, Media & Resume", () => {
  beforeEach(() => {
    process.env.DATA_ADAPTER_MODE = "fixture";
    getCmsStore().resetToDefaults();
  });

  describe("1. Single-Admin Authentication & Signed Session Tokens", () => {
    it("authenticates valid single-admin credentials and rejects invalid credentials", async () => {
      const success = await authenticateSingleAdminCredentials({
        email: "admin@muhamadfauzan.dev",
        password: "AdminPortfolio2026!",
      });
      expect(success.admin.email).toBe("admin@muhamadfauzan.dev");
      expect(success.token).toBeTruthy();

      await expect(
        authenticateSingleAdminCredentials({
          email: "intruder@example.com",
          password: "AdminPortfolio2026!",
        }),
      ).rejects.toThrow(UnauthorizedAdminError);

      await expect(
        authenticateSingleAdminCredentials({
          email: "admin@muhamadfauzan.dev",
          password: "wrong-password",
        }),
      ).rejects.toThrow(UnauthorizedAdminError);
    });

    it("verifies active signed session tokens and rejects expired or tampered tokens", () => {
      const validToken = createSignedAdminSessionToken({
        authUserId: TEST_ADMIN.authUserId,
        email: TEST_ADMIN.email,
        ttlSeconds: 3600,
      });
      const verified = verifySignedAdminSessionToken(validToken);
      expect(verified?.email).toBe(TEST_ADMIN.email);

      const expiredToken = createSignedAdminSessionToken({
        authUserId: TEST_ADMIN.authUserId,
        email: TEST_ADMIN.email,
        ttlSeconds: -10,
      });
      expect(verifySignedAdminSessionToken(expiredToken)).toBeNull();

      const tampered = `${validToken.slice(0, -4)}xxxx`;
      expect(verifySignedAdminSessionToken(tampered)).toBeNull();
    });
  });

  describe("2. Draft → Preview → Publish & Public Isolation across CMS Modules", () => {
    it("keeps GeoEntity, ClayCV, and SPK Bansos SAW as draft by default and isolates draft edits from public queries", async () => {
      const repo = new FixturePortfolioRepository();
      const initialPublicProjects = await repo.getPublishedProjects();
      expect(initialPublicProjects).toHaveLength(0);

      const snapshot = getAdminDashboardSnapshot();
      expect(snapshot.projects).toHaveLength(3);
      expect(snapshot.projects.every((p) => p.status === "draft")).toBe(true);

      const geoEntity = snapshot.projects.find((p) => p.slug === "geoentity")!;
      const updatedDraft = {
        ...geoEntity.draftData,
        description:
          "Updated draft description for GeoEntity with PostGIS spatial indexing.",
      };

      await cmsEngines.project().saveDraft({
        admin: TEST_ADMIN,
        entityType: "project",
        entityId: geoEntity.entityId,
        slug: geoEntity.slug,
        draftPayload: updatedDraft,
        changeSummary: "Refined GeoEntity draft summary",
      });

      // Public query still returns null while draft
      expect(await repo.getPublishedProjectBySlug("geoentity")).toBeNull();

      // Authenticated admin preview returns updated draft
      const preview = await cmsEngines.project().previewDraft({
        admin: TEST_ADMIN,
        entityType: "project",
        entityId: geoEntity.entityId,
      });
      expect(preview.draftData.description).toContain("PostGIS spatial indexing");
      expect(preview.currentlyPublishedData).toBeNull();

      // Unauthenticated preview throws
      await expect(
        cmsEngines.project().previewDraft({
          admin: null,
          entityType: "project",
          entityId: geoEntity.entityId,
        }),
      ).rejects.toThrow(/Unauthorized preview request/);

      // Publish project -> immediately visible on public repository
      await cmsEngines.project().publishDraft({
        admin: TEST_ADMIN,
        entityType: "project",
        entityId: geoEntity.entityId,
        changeSummary: "Published GeoEntity v1",
      });

      const publishedGeo = await repo.getPublishedProjectBySlug("geoentity");
      expect(publishedGeo).not.toBeNull();
      expect(publishedGeo?.description).toContain("PostGIS spatial indexing");

      // Subsequent draft edit does NOT overwrite published project
      await cmsEngines.project().saveDraft({
        admin: TEST_ADMIN,
        entityType: "project",
        entityId: geoEntity.entityId,
        slug: geoEntity.slug,
        draftPayload: {
          ...publishedGeo!,
          description: "Unpublished experimental v2 draft description.",
        },
        changeSummary: "Experimental v2 draft",
      });

      const stillLiveV1 = await repo.getPublishedProjectBySlug("geoentity");
      expect(stillLiveV1?.description).toContain("PostGIS spatial indexing");
      expect(stillLiveV1?.description).not.toContain("Experimental v2");

      // Unpublish back to draft -> removed from public repository
      await cmsEngines.project().transitionPublicationState({
        admin: TEST_ADMIN,
        entityType: "project",
        entityId: geoEntity.entityId,
        targetState: "draft",
      });
      expect(await repo.getPublishedProjectBySlug("geoentity")).toBeNull();
    });

    it("supports Profile, Hero, About, Skills, Experience, Education, Certifications, Notes, and Boot Greetings CRUD", async () => {
      const repo = new FixturePortfolioRepository();
      const snap = getAdminDashboardSnapshot();

      // Profile draft save vs publish
      await cmsEngines.profile().saveDraft({
        admin: TEST_ADMIN,
        entityType: "profile",
        entityId: "singleton",
        draftPayload: {
          ...snap.profile.draftData,
          tagline: "Draft Tagline Only",
        },
      });
      let bundle = await repo.getPublicPortfolioBundle();
      expect(bundle.profile.tagline).not.toBe("Draft Tagline Only");

      await cmsEngines.profile().publishDraft({
        admin: TEST_ADMIN,
        entityType: "profile",
        entityId: "singleton",
      });
      bundle = await repo.getPublicPortfolioBundle();
      expect(bundle.profile.tagline).toBe("Draft Tagline Only");

      // Skills CRUD
      const firstCat = snap.skillCategories[0]!;
      saveSkillCategoryInStore({
        admin: TEST_ADMIN,
        category: {
          ...firstCat,
          skills: [
            ...firstCat.skills,
            {
              id: "skill-rust",
              categoryId: firstCat.id,
              name: "Rust",
              proficiency: "Exploring",
              isEnabled: true,
              displayOrder: 99,
              status: "published",
            },
          ],
        },
      });
      bundle = await repo.getPublicPortfolioBundle();
      expect(
        bundle.skillCategories[0]?.skills.some((s) => s.name === "Rust"),
      ).toBe(true);

      // Boot Greetings CRUD
      saveBootGreetingInStore({
        admin: TEST_ADMIN,
        greeting: {
          id: "greet-aceh",
          language: "Aceh",
          greeting: "Saleum Teuka",
          meaning: "Selamat Datang",
          isEnabled: true,
          displayOrder: 20,
          status: "published",
        },
      });
      const greetings = await repo.getBootGreetings();
      expect(greetings.some((g) => g.language === "Aceh")).toBe(true);

      deleteBootGreetingFromStore({
        admin: TEST_ADMIN,
        greetingId: "greet-aceh",
      });
      expect(
        (await repo.getBootGreetings()).some((g) => g.language === "Aceh"),
      ).toBe(false);
    });
  });

  describe("3. Media Reference Protection, Private Resume Drafts, and Audit/Revision Preservation", () => {
    it("blocks deleting a media asset currently referenced by a project and allows deletion once unreferenced", async () => {
      const asset = registerMediaAssetInStore({
        admin: TEST_ADMIN,
        candidate: {
          bucket: "projects",
          fileName: "geoentity-cover.webp",
          mimeType: "image/webp",
          sizeBytes: 120000,
          altText: "GeoEntity Cover",
        },
      });

      const snap = getAdminDashboardSnapshot();
      const geo = snap.projects.find((p) => p.slug === "geoentity")!;

      await cmsEngines.project().saveDraft({
        admin: TEST_ADMIN,
        entityType: "project",
        entityId: geo.entityId,
        slug: geo.slug,
        draftPayload: {
          ...geo.draftData,
          coverUrl: asset.publicUrl,
        },
      });

      expect(() =>
        deleteMediaAssetFromStore({
          admin: TEST_ADMIN,
          mediaId: asset.id,
        }),
      ).toThrow(/currently referenced by project "GeoEntity"/);

      // Unreference coverUrl and delete
      await cmsEngines.project().saveDraft({
        admin: TEST_ADMIN,
        entityType: "project",
        entityId: geo.entityId,
        slug: geo.slug,
        draftPayload: {
          ...geo.draftData,
          coverUrl: null,
        },
      });

      deleteMediaAssetFromStore({
        admin: TEST_ADMIN,
        mediaId: asset.id,
      });
      expect(getAdminDashboardSnapshot().mediaAssets).toHaveLength(0);
    });

    it("keeps uploaded resume versions private until explicitly set active & published", async () => {
      const repo = new FixturePortfolioRepository();
      expect((await repo.getPublicPortfolioBundle()).activeResume).toBeNull();

      const draftResume = uploadResumeVersionToStore({
        admin: TEST_ADMIN,
        versionLabel: "v2026.1",
        fileName: "Muhamad-Fauzan-CV.pdf",
        mimeType: "application/pdf",
        sizeBytes: 150000,
        summaryNote: "Initial draft resume",
      });
      expect(draftResume.status).toBe("draft");
      expect(draftResume.isActive).toBe(false);
      expect(draftResume.fileUrl).toBeNull();

      // Still null on public bundle while draft
      expect((await repo.getPublicPortfolioBundle()).activeResume).toBeNull();

      // Publish & set active
      setActivePublishedResumeInStore({
        admin: TEST_ADMIN,
        resumeId: draftResume.id,
      });

      const liveResume = (await repo.getPublicPortfolioBundle()).activeResume;
      expect(liveResume).not.toBeNull();
      expect(liveResume?.versionLabel).toBe("v2026.1");
      expect(liveResume?.fileUrl).toBe(`/api/resume/download/${draftResume.id}`);
    });

    it("preserves revision history and audit logs even when an entity is deleted", async () => {
      const store = getCmsStore();
      const noteId = "note-temp-test";

      await cmsEngines.note().saveDraft({
        admin: TEST_ADMIN,
        entityType: "note",
        entityId: noteId,
        slug: "temp-architecture-note",
        draftPayload: {
          id: noteId,
          title: "Temporary Architecture Note",
          slug: "temp-architecture-note",
          summary: "Temporary summary for revision preservation verification.",
          contentMdx: "## Architecture\n\nTemporary content body for testing.",
          coverImageUrl: null,
          category: "Systems",
          tags: ["Testing"],
          publishedAt: null,
          seoTitle: null,
          seoDescription: null,
          status: "draft",
        },
        changeSummary: "Created temporary note v1",
      });

      store.deleteEntityPreservingHistory({
        admin: TEST_ADMIN,
        entityType: "note",
        entityId: noteId,
      });

      const snap = getAdminDashboardSnapshot();
      expect(snap.notes.some((n) => n.entityId === noteId)).toBe(false);
      expect(
        snap.revisions.some(
          (r) => r.entityType === "note" && r.entityId === noteId,
        ),
      ).toBe(true);
      expect(
        snap.auditLogs.some(
          (a) => a.action === "delete_entity" && a.entityId === noteId,
        ),
      ).toBe(true);
    });
  });

  describe("4. Full Home Section CMS Lifecycle (Draft → Preview → Publish → Unpublish → Delete) & Supabase Singleton Key Mapping", () => {
    it("verifies full CRUD and Draft → Preview → Publish → Unpublish → Delete across Experience, Education, Certifications, About, and Profile", async () => {
      const repo = new FixturePortfolioRepository();
      const store = getCmsStore();

      // 1. Experience lifecycle
      const expId = "exp-audit-1";
      await cmsEngines.experience().saveDraft({
        admin: TEST_ADMIN,
        entityType: "experience",
        entityId: expId,
        draftPayload: {
          id: expId,
          organization: "Audit Systems Ltd",
          role: "Principal Systems Engineer",
          employmentType: "Full-time",
          workSystem: "Remote",
          location: "Bandung, Indonesia",
          startMonth: 1,
          startYear: 2025,
          endMonth: null,
          endYear: null,
          isCurrent: true,
          description: "Architected high-assurance distributed services.",
          responsibilities: ["Designed deterministic transactional pipelines"],
          technicalContributions: ["Reduced p99 latency by 40%"],
          achievements: ["Zero production incidents across 2025"],
          technologies: ["TypeScript", "PostgreSQL", "Go"],
          displayOrder: 1,
          status: "draft",
        },
        changeSummary: "Created experience draft",
      });
      expect((await repo.getPublicPortfolioBundle()).experiences).toHaveLength(0);

      const expPreview = await cmsEngines.experience().previewDraft({
        admin: TEST_ADMIN,
        entityType: "experience",
        entityId: expId,
      });
      expect(expPreview.draftData.organization).toBe("Audit Systems Ltd");
      expect(expPreview.currentlyPublishedData).toBeNull();

      await cmsEngines.experience().publishDraft({
        admin: TEST_ADMIN,
        entityType: "experience",
        entityId: expId,
        changeSummary: "Published experience",
      });
      expect((await repo.getPublicPortfolioBundle()).experiences).toHaveLength(1);
      expect(
        (await repo.getPublicPortfolioBundle()).experiences[0]?.organization,
      ).toBe("Audit Systems Ltd");

      await cmsEngines.experience().transitionPublicationState({
        admin: TEST_ADMIN,
        entityType: "experience",
        entityId: expId,
        targetState: "draft",
      });
      expect((await repo.getPublicPortfolioBundle()).experiences).toHaveLength(0);

      store.deleteEntityPreservingHistory({
        admin: TEST_ADMIN,
        entityType: "experience",
        entityId: expId,
      });
      expect(
        getAdminDashboardSnapshot().experiences.some((e) => e.entityId === expId),
      ).toBe(false);

      // 2. Education lifecycle (feeds Home Me section)
      const eduId = "edu-audit-1";
      await cmsEngines.education().saveDraft({
        admin: TEST_ADMIN,
        entityType: "education",
        entityId: eduId,
        draftPayload: {
          id: eduId,
          institution: "Universitas Pendidikan Indonesia",
          degree: "Bachelor of Computer Science",
          major: "Software Engineering",
          startDate: "2021",
          endDate: "2025",
          isCurrent: false,
          gpa: "3.90 / 4.00",
          defenseGrade: "A",
          thesisTitle: "Spatial Indexing in Distributed Relational Systems",
          description: "Software Engineering concentration.",
          displayOrder: 1,
          status: "draft",
        },
      });
      expect((await repo.getPublicPortfolioBundle()).educations).toHaveLength(0);

      await cmsEngines.education().publishDraft({
        admin: TEST_ADMIN,
        entityType: "education",
        entityId: eduId,
      });
      expect((await repo.getPublicPortfolioBundle()).educations).toHaveLength(1);
      expect(
        (await repo.getPublicPortfolioBundle()).educations[0]?.institution,
      ).toBe("Universitas Pendidikan Indonesia");

      await cmsEngines.education().transitionPublicationState({
        admin: TEST_ADMIN,
        entityType: "education",
        entityId: eduId,
        targetState: "draft",
      });
      expect((await repo.getPublicPortfolioBundle()).educations).toHaveLength(0);

      store.deleteEntityPreservingHistory({
        admin: TEST_ADMIN,
        entityType: "education",
        entityId: eduId,
      });
      expect(
        getAdminDashboardSnapshot().educations.some((e) => e.entityId === eduId),
      ).toBe(false);

      // 3. Certifications lifecycle
      const certId = "cert-audit-1";
      await cmsEngines.certification().saveDraft({
        admin: TEST_ADMIN,
        entityType: "certification",
        entityId: certId,
        draftPayload: {
          id: certId,
          name: "PostgreSQL Internals & Administration",
          issuingOrganization: "Linux Foundation",
          issueMonth: 6,
          issueYear: 2025,
          expirationMonth: null,
          expirationYear: null,
          credentialId: "LF-PG-2025",
          credentialUrl: "https://example.com/verify/lf-pg-2025",
          certificateMediaUrl: null,
          description: "Verified database administration certification.",
          displayOrder: 1,
          status: "draft",
        },
      });
      expect((await repo.getPublicPortfolioBundle()).certifications).toHaveLength(
        0,
      );

      await cmsEngines.certification().publishDraft({
        admin: TEST_ADMIN,
        entityType: "certification",
        entityId: certId,
      });
      expect((await repo.getPublicPortfolioBundle()).certifications).toHaveLength(
        1,
      );
      expect(
        (await repo.getPublicPortfolioBundle()).certifications[0]?.name,
      ).toBe("PostgreSQL Internals & Administration");

      await cmsEngines.certification().transitionPublicationState({
        admin: TEST_ADMIN,
        entityType: "certification",
        entityId: certId,
        targetState: "draft",
      });
      expect((await repo.getPublicPortfolioBundle()).certifications).toHaveLength(
        0,
      );

      store.deleteEntityPreservingHistory({
        admin: TEST_ADMIN,
        entityType: "certification",
        entityId: certId,
      });
      expect(
        getAdminDashboardSnapshot().certifications.some(
          (c) => c.entityId === certId,
        ),
      ).toBe(false);
    });

    it("maps entityId='singleton' to key=entityType in SupabasePublishingStore for singleton tables and RPC calls", async () => {
      const eqCalls: Array<{ column: string; value: string }> = [];
      const upsertCalls: Array<Record<string, unknown>> = [];
      const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = [];

      const mockClient = {
        from: () => ({
          select: () => ({
            eq: (column: string, value: string) => {
              eqCalls.push({ column, value });
              return {
                maybeSingle: async () => ({
                  data: {
                    key: value,
                    status: "published",
                    current_revision: 2,
                    draft_data: { fullName: "Muhamad Fauzan" },
                    published_data: { fullName: "Muhamad Fauzan" },
                    published_at: "2026-03-01T00:00:00Z",
                    updated_at: "2026-03-01T00:00:00Z",
                  },
                  error: null,
                }),
              };
            },
          }),
          upsert: async (payload: Record<string, unknown>) => {
            upsertCalls.push(payload);
            return { error: null };
          },
        }),
        rpc: async (fn: string, args: Record<string, unknown>) => {
          rpcCalls.push({ fn, args });
          return { data: null, error: null };
        },
      };

      const store = new SupabasePublishingStore<{ fullName: string }>(
        mockClient as never,
      );

      const loaded = await store.getEntity("profile", "singleton");
      expect(eqCalls[0]).toEqual({ column: "key", value: "profile" });
      expect(loaded?.entityId).toBe("singleton");

      await store.saveEntity({
        entityType: "profile",
        entityId: "singleton",
        status: "draft",
        draftData: { fullName: "Muhamad Fauzan Updated" },
        publishedData: { fullName: "Muhamad Fauzan" },
        publishedRevisionId: null,
        draftRevisionId: null,
        publishedAt: "2026-03-01T00:00:00Z",
        updatedAt: "2026-03-02T00:00:00Z",
      });
      expect(upsertCalls[0]?.key).toBe("profile");

      await store.publishTransaction({
        entityType: "about_content",
        entityId: "singleton",
        revisionId: "rev-1",
        versionNumber: 4,
        snapshot: { fullName: "About" },
        changeSummary: "Publish about",
        actorId: TEST_ADMIN.adminId,
        actorEmail: TEST_ADMIN.email,
      });
      expect(rpcCalls[0]?.fn).toBe("publish_entity");
      expect(rpcCalls[0]?.args.p_entity_id).toBe("about_content");

      await store.unpublishTransaction({
        entityType: "about_content",
        entityId: "singleton",
        targetState: "draft",
        actorId: TEST_ADMIN.adminId,
        actorEmail: TEST_ADMIN.email,
      });
      expect(rpcCalls[1]?.fn).toBe("unpublish_entity");
      expect(rpcCalls[1]?.args.p_entity_id).toBe("about_content");
    });
  });
});
