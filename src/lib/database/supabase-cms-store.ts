import crypto from "crypto";
import type { VerifiedAdminContext } from "@/lib/auth/admin-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateMediaUpload, type FileUploadCandidate } from "@/lib/validations/cms";
import type {
  AuditLogEntry,
  PublicationRecord,
  PublishingStoreAdapter,
  RevisionRecord,
  VersionedEntityRecord,
} from "@/features/publishing/publishing-engine";
import type { ContentStatusDb, Database, PublishableEntityType } from "@/types/database";
import type {
  AboutContent,
  BootGreeting,
  CertificationItem,
  EducationItem,
  EngineeringNote,
  ExperienceItem,
  HeroContent,
  ProfileData,
  ProjectDetail,
  SiteSettings,
  SkillCategory,
} from "@/types/portfolio";
import type {
  CmsDashboardSnapshot,
  MediaAssetRecord,
  ResumeFileRecord,
} from "@/lib/database/cms-store";
import {
  INITIAL_ABOUT,
  INITIAL_HERO,
  INITIAL_PROFILE,
  INITIAL_SITE_SETTINGS,
} from "@/lib/database/fixtures";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Standard RFC 4122 DNS namespace UUID for deterministic name-based UUID generation (v5).
 * Guarantees that any legacy string identifier maps to the exact same canonical UUID across
 * all environments, application restarts, and relational foreign keys.
 */
export const CMS_IDENTITY_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

/**
 * Generates an RFC 4122 UUID v5 deterministically from an arbitrary string identifier.
 */
export function deterministicUuid(name: string, namespace = CMS_IDENTITY_NAMESPACE): string {
  const hex = namespace.replace(/-/g, "");
  const nsBytes = Buffer.from(hex, "hex");
  const nameBytes = Buffer.from(name, "utf8");
  const hash = crypto
    .createHash("sha1")
    .update(Buffer.concat([nsBytes, nameBytes]))
    .digest();

  // Set octet 6: version 5 (0101xxxx)
  hash[6] = (hash[6]! & 0x0f) | 0x50;
  // Set octet 8: variant RFC 4122 (10xxxxxx)
  hash[8] = (hash[8]! & 0x3f) | 0x80;

  const h = hash.toString("hex", 0, 16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Ensures an identifier is a valid PostgreSQL UUID:
 * - If already a valid UUID (v1-v5), returns it normalized to lowercase without modification.
 * - If non-UUID string, deterministically hashes to an RFC 4122 UUID v5.
 * - Never uses non-deterministic random UUIDs during read, update, or relational queries.
 */
export function ensureValidUuid(id: string): string {
  const trimmed = id.trim();
  if (UUID_REGEX.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return deterministicUuid(trimmed);
}

/**
 * Production-ready Persistent Supabase Publishing Store Adapter.
 * Integrates directly with PostgreSQL tables, transactional RPCs, and RLS policies.
 */
export class SupabasePublishingStore<T = unknown> implements PublishingStoreAdapter<T> {
  constructor(private readonly clientOverride?: SupabaseClient) {}

  private async getClient(): Promise<SupabaseClient> {
    if (this.clientOverride) {
      return this.clientOverride;
    }
    return createSupabaseServerClient();
  }

  async getEntity(
    entityType: PublishableEntityType,
    entityId: string,
  ): Promise<VersionedEntityRecord<T> | null> {
    const supabase = await this.getClient();

    if (
      entityType === "profile" ||
      entityType === "site_settings" ||
      entityType === "hero_content" ||
      entityType === "about_content"
    ) {
      const singletonKey = entityType;
      const { data, error } = await supabase
        .from("singleton_configs")
        .select("*")
        .eq("key", singletonKey)
        .maybeSingle();

      if (error || !data) return null;

      return {
        entityType,
        entityId,
        status: data.status,
        publishedData: data.published_data as T | null,
        draftData: data.draft_data as T,
        publishedRevisionId: data.published_revision_id,
        draftRevisionId: data.draft_revision_id,
        publishedAt: data.published_at,
        updatedAt: data.updated_at,
      };
    }

    if (entityType === "project") {
      const isUuid = /^[0-9a-f-]{36}$/i.test(entityId);
      const query = supabase.from("projects").select("*");
      const { data, error } = await (isUuid
        ? query.eq("id", entityId).maybeSingle()
        : query.eq("slug", entityId).maybeSingle());

      if (error || !data) return null;

      return {
        entityType: "project",
        entityId: data.id,
        slug: data.slug,
        status: data.status,
        publishedData: data.published_data as T | null,
        draftData: data.draft_data as T,
        publishedRevisionId: data.published_revision_id,
        draftRevisionId: data.draft_revision_id,
        publishedAt: data.published_at,
        updatedAt: data.updated_at,
      };
    }

    if (entityType === "experience") {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("id", ensureValidUuid(entityId))
        .maybeSingle();

      if (error || !data) return null;

      return {
        entityType: "experience",
        entityId: data.id,
        status: data.status,
        publishedData: data.published_data as T | null,
        draftData: data.draft_data as T,
        publishedRevisionId: data.published_revision_id,
        draftRevisionId: null,
        publishedAt: null,
        updatedAt: data.updated_at,
      };
    }

    if (entityType === "education") {
      const { data, error } = await supabase
        .from("educations")
        .select("*")
        .eq("id", ensureValidUuid(entityId))
        .maybeSingle();

      if (error || !data) return null;

      return {
        entityType: "education",
        entityId: data.id,
        status: data.status,
        publishedData: data.published_data as T | null,
        draftData: data.draft_data as T,
        publishedRevisionId: data.published_revision_id,
        draftRevisionId: null,
        publishedAt: null,
        updatedAt: data.updated_at,
      };
    }

    if (entityType === "certification") {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .eq("id", ensureValidUuid(entityId))
        .maybeSingle();

      if (error || !data) return null;

      return {
        entityType: "certification",
        entityId: data.id,
        status: data.status,
        publishedData: data.published_data as T | null,
        draftData: data.draft_data as T,
        publishedRevisionId: data.published_revision_id,
        draftRevisionId: null,
        publishedAt: null,
        updatedAt: data.updated_at,
      };
    }

    if (entityType === "note") {
      const isUuid = /^[0-9a-f-]{36}$/i.test(entityId);
      const query = supabase.from("notes").select("*");
      const { data, error } = await (isUuid
        ? query.eq("id", entityId).maybeSingle()
        : query.eq("slug", entityId).maybeSingle());

      if (error || !data) return null;

      return {
        entityType: "note",
        entityId: data.id,
        slug: data.slug,
        status: data.status,
        publishedData: data.published_data as T | null,
        draftData: data.draft_data as T,
        publishedRevisionId: data.published_revision_id,
        draftRevisionId: null,
        publishedAt: data.published_at,
        updatedAt: data.updated_at,
      };
    }

    return null;
  }

  async saveEntity(record: VersionedEntityRecord<T>): Promise<void> {
    const supabase = await this.getClient();

    if (
      record.entityType === "profile" ||
      record.entityType === "site_settings" ||
      record.entityType === "hero_content" ||
      record.entityType === "about_content"
    ) {
      const key = record.entityType;
      const { error } = await supabase.from("singleton_configs").upsert({
        key,
        status: record.status,
        published_data:
          (record.publishedData as unknown as Database["public"]["Tables"]["singleton_configs"]["Insert"]["published_data"]) ??
          null,
        draft_data:
          record.draftData as unknown as Database["public"]["Tables"]["singleton_configs"]["Insert"]["draft_data"],
        published_revision_id: record.publishedRevisionId,
        draft_revision_id: record.draftRevisionId,
        published_at: record.publishedAt,
        updated_at: record.updatedAt,
      });
      if (error) throw new Error(`Supabase saveEntity error (${key}): ${error.message}`);
      return;
    }

    if (record.entityType === "project") {
      const proj = record.draftData as unknown as ProjectDetail;
      const id = ensureValidUuid(record.entityId);
      const { error } = await supabase.from("projects").upsert({
        id,
        slug: record.slug || proj.slug || id,
        name: proj.name || "Untitled Project",
        category: proj.category || "Engineering",
        status: record.status,
        is_featured: proj.isFeatured ?? false,
        display_order: proj.displayOrder ?? 0,
        cover_media_id: null,
        published_data:
          (record.publishedData as unknown as Database["public"]["Tables"]["projects"]["Insert"]["published_data"]) ??
          null,
        draft_data:
          record.draftData as unknown as Database["public"]["Tables"]["projects"]["Insert"]["draft_data"],
        published_revision_id: record.publishedRevisionId,
        draft_revision_id: record.draftRevisionId,
        published_at: record.publishedAt,
        updated_at: record.updatedAt,
      });
      if (error) throw new Error(`Supabase saveEntity error (project): ${error.message}`);
      return;
    }

    if (record.entityType === "experience") {
      const exp = record.draftData as unknown as ExperienceItem;
      const id = ensureValidUuid(record.entityId);
      const { error } = await supabase.from("experiences").upsert({
        id,
        organization: exp.organization || "",
        role: exp.role || "",
        employment_type: exp.employmentType || "Full-time",
        work_system: exp.workSystem || "Hybrid",
        location: exp.location || "",
        start_month: exp.startMonth || 1,
        start_year: exp.startYear || 2024,
        end_month: exp.endMonth ?? null,
        end_year: exp.endYear ?? null,
        is_current: exp.isCurrent ?? false,
        display_order: exp.displayOrder ?? 0,
        status: record.status,
        published_data:
          (record.publishedData as unknown as Database["public"]["Tables"]["experiences"]["Insert"]["published_data"]) ??
          null,
        draft_data:
          record.draftData as unknown as Database["public"]["Tables"]["experiences"]["Insert"]["draft_data"],
        published_revision_id: record.publishedRevisionId,
        updated_at: record.updatedAt,
      });
      if (error) throw new Error(`Supabase saveEntity error (experience): ${error.message}`);
      return;
    }

    if (record.entityType === "education") {
      const edu = record.draftData as unknown as EducationItem;
      const id = ensureValidUuid(record.entityId);
      const { error } = await supabase.from("educations").upsert({
        id,
        institution: edu.institution || "",
        degree: edu.degree || "",
        major: edu.major || "",
        start_date: edu.startDate || "2020",
        end_date: edu.endDate ?? null,
        is_current: edu.isCurrent ?? false,
        display_order: edu.displayOrder ?? 0,
        status: record.status,
        published_data:
          (record.publishedData as unknown as Database["public"]["Tables"]["educations"]["Insert"]["published_data"]) ??
          null,
        draft_data:
          record.draftData as unknown as Database["public"]["Tables"]["educations"]["Insert"]["draft_data"],
        published_revision_id: record.publishedRevisionId,
        updated_at: record.updatedAt,
      });
      if (error) throw new Error(`Supabase saveEntity error (education): ${error.message}`);
      return;
    }

    if (record.entityType === "certification") {
      const cert = record.draftData as unknown as CertificationItem;
      const id = ensureValidUuid(record.entityId);
      const { error } = await supabase.from("certifications").upsert({
        id,
        name: cert.name || "",
        issuing_organization: cert.issuingOrganization || "",
        issue_month: cert.issueMonth || 1,
        issue_year: cert.issueYear || 2024,
        expiration_month: cert.expirationMonth ?? null,
        expiration_year: cert.expirationYear ?? null,
        credential_id: cert.credentialId ?? null,
        credential_url: cert.credentialUrl ?? null,
        certificate_media_id: null,
        display_order: cert.displayOrder ?? 0,
        status: record.status,
        published_data:
          (record.publishedData as unknown as Database["public"]["Tables"]["certifications"]["Insert"]["published_data"]) ??
          null,
        draft_data:
          record.draftData as unknown as Database["public"]["Tables"]["certifications"]["Insert"]["draft_data"],
        published_revision_id: record.publishedRevisionId,
        updated_at: record.updatedAt,
      });
      if (error) throw new Error(`Supabase saveEntity error (certification): ${error.message}`);
      return;
    }

    if (record.entityType === "note") {
      const note = record.draftData as unknown as EngineeringNote;
      const id = ensureValidUuid(record.entityId);
      const { error } = await supabase.from("notes").upsert({
        id,
        slug: record.slug || note.slug || id,
        title: note.title || "Untitled Note",
        category: note.category || "Engineering",
        display_order: 0,
        status: record.status,
        cover_media_id: null,
        published_data:
          (record.publishedData as unknown as Database["public"]["Tables"]["notes"]["Insert"]["published_data"]) ??
          null,
        draft_data:
          record.draftData as unknown as Database["public"]["Tables"]["notes"]["Insert"]["draft_data"],
        published_revision_id: record.publishedRevisionId,
        published_at: record.publishedAt,
        updated_at: record.updatedAt,
      });
      if (error) throw new Error(`Supabase saveEntity error (note): ${error.message}`);
      return;
    }
  }

  async getRevisions(
    entityType: PublishableEntityType,
    entityId: string,
  ): Promise<RevisionRecord<T>[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("content_revisions")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("version_number", { ascending: false });

    if (error || !data) return [];

    return data.map((r) => ({
      id: r.id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      versionNumber: r.version_number,
      state: r.state,
      snapshot: r.snapshot as T,
      changeSummary: r.change_summary,
      createdBy: r.created_by ?? "",
      createdAt: r.created_at,
    }));
  }

  async appendRevision(revision: RevisionRecord<T>): Promise<void> {
    const supabase = await this.getClient();
    const id = ensureValidUuid(revision.id);
    const createdBy = revision.createdBy ? ensureValidUuid(revision.createdBy) : null;

    const { error } = await supabase.from("content_revisions").insert({
      id,
      entity_type: revision.entityType,
      entity_id: revision.entityId,
      version_number: revision.versionNumber,
      state: revision.state,
      snapshot:
        revision.snapshot as Database["public"]["Tables"]["content_revisions"]["Insert"]["snapshot"],
      change_summary: revision.changeSummary,
      created_by: createdBy,
      created_at: revision.createdAt,
    });

    if (error) {
      throw new Error(`Supabase appendRevision error: ${error.message}`);
    }
  }

  async appendPublication(publication: PublicationRecord): Promise<void> {
    const supabase = await this.getClient();
    const id = ensureValidUuid(publication.id);
    const revisionId = publication.revisionId ? ensureValidUuid(publication.revisionId) : null;
    const publishedBy = publication.publishedBy ? ensureValidUuid(publication.publishedBy) : null;

    const { error } = await supabase.from("content_publications").insert({
      id,
      entity_type: publication.entityType,
      entity_id: publication.entityId,
      revision_id: revisionId,
      action: publication.action,
      published_by: publishedBy,
      published_at: publication.publishedAt,
    });

    if (error) {
      throw new Error(`Supabase appendPublication error: ${error.message}`);
    }
  }

  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    const supabase = await this.getClient();
    const id = ensureValidUuid(entry.id);
    const actorId = entry.actorId ? ensureValidUuid(entry.actorId) : null;

    const { error } = await supabase.from("audit_logs").insert({
      id,
      actor_id: actorId,
      actor_email: entry.actorEmail,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      metadata: entry.metadata as Database["public"]["Tables"]["audit_logs"]["Insert"]["metadata"],
      created_at: entry.createdAt,
    });

    if (error) {
      throw new Error(`Supabase appendAuditLog error: ${error.message}`);
    }
  }

  /**
   * Transactional Publish via PostgreSQL RPC (Migration 00003).
   */
  async publishTransaction(params: {
    entityType: PublishableEntityType;
    entityId: string;
    revisionId: string;
    versionNumber: number;
    snapshot: T;
    changeSummary?: string;
    actorId?: string;
    actorEmail?: string;
  }): Promise<boolean> {
    const supabase = await this.getClient();
    const revisionId = ensureValidUuid(params.revisionId);
    const actorId = params.actorId ? ensureValidUuid(params.actorId) : null;
    const rpcEntityId =
      params.entityType === "profile" ||
      params.entityType === "site_settings" ||
      params.entityType === "hero_content" ||
      params.entityType === "about_content"
        ? params.entityType
        : params.entityId;

    const { error } = await supabase.rpc("publish_entity", {
      p_entity_type: params.entityType,
      p_entity_id: rpcEntityId,
      p_revision_id: revisionId,
      p_version_number: params.versionNumber,
      p_snapshot:
        params.snapshot as unknown as Database["public"]["Tables"]["content_revisions"]["Insert"]["snapshot"],
      p_change_summary: params.changeSummary ?? `Published v${params.versionNumber}`,
      p_actor_id: actorId,
      p_actor_email: params.actorEmail ?? "admin",
    });

    if (error) {
      console.warn(
        "publish_entity RPC call failed, falling back to sequential store writes:",
        error.message,
      );
      return false;
    }

    return true;
  }

  /**
   * Transactional Unpublish / Archive via PostgreSQL RPC (Migration 00003).
   */
  async unpublishTransaction(params: {
    entityType: PublishableEntityType;
    entityId: string;
    targetState: "draft" | "archived";
    actorId?: string;
    actorEmail?: string;
  }): Promise<boolean> {
    const supabase = await this.getClient();
    const actorId = params.actorId ? ensureValidUuid(params.actorId) : null;
    const rpcEntityId =
      params.entityType === "profile" ||
      params.entityType === "site_settings" ||
      params.entityType === "hero_content" ||
      params.entityType === "about_content"
        ? params.entityType
        : params.entityId;

    const { error } = await supabase.rpc("unpublish_entity", {
      p_entity_type: params.entityType,
      p_entity_id: rpcEntityId,
      p_target_state: params.targetState,
      p_actor_id: actorId,
      p_actor_email: params.actorEmail ?? "admin",
    });

    if (error) {
      console.warn(
        "unpublish_entity RPC call failed, falling back to sequential store writes:",
        error.message,
      );
      return false;
    }

    return true;
  }
}

/**
 * Loads the complete CMS dashboard snapshot from Supabase PostgreSQL.
 */
export async function loadSupabaseDashboardSnapshot(): Promise<CmsDashboardSnapshot> {
  const supabase = await createSupabaseServerClient();

  const [
    singletonRes,
    categoriesRes,
    projectsRes,
    experiencesRes,
    educationsRes,
    certificationsRes,
    notesRes,
    greetingsRes,
    mediaRes,
    resumeRes,
    revisionsRes,
    pubsRes,
    auditRes,
  ] = await Promise.all([
    supabase.from("singleton_configs").select("*"),
    supabase
      .from("skill_categories")
      .select("*, skills(*)")
      .order("display_order", { ascending: true }),
    supabase.from("projects").select("*").order("display_order", { ascending: true }),
    supabase.from("experiences").select("*").order("display_order", { ascending: true }),
    supabase.from("educations").select("*").order("display_order", { ascending: true }),
    supabase.from("certifications").select("*").order("display_order", { ascending: true }),
    supabase.from("notes").select("*").order("display_order", { ascending: true }),
    supabase.from("boot_greetings").select("*").order("display_order", { ascending: true }),
    supabase.from("media_assets").select("*").order("created_at", { ascending: false }),
    supabase.from("resume_files").select("*").order("created_at", { ascending: false }),
    supabase.from("content_revisions").select("*").order("created_at", { ascending: false }),
    supabase.from("content_publications").select("*").order("published_at", { ascending: false }),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }),
  ]);

  const configMap = new Map<string, Database["public"]["Tables"]["singleton_configs"]["Row"]>();
  for (const row of singletonRes.data ?? []) {
    configMap.set(row.key, row);
  }

  const profileRow = configMap.get("profile");
  const heroRow = configMap.get("hero_content");
  const aboutRow = configMap.get("about_content");
  const settingsRow = configMap.get("site_settings");

  const now = new Date().toISOString();

  const profile: VersionedEntityRecord<ProfileData> = {
    entityType: "profile",
    entityId: "singleton",
    status: (profileRow?.status as ContentStatusDb) ?? "published",
    publishedData: (profileRow?.published_data as unknown as ProfileData) ?? INITIAL_PROFILE,
    draftData: (profileRow?.draft_data as unknown as ProfileData) ?? INITIAL_PROFILE,
    publishedRevisionId: profileRow?.published_revision_id ?? null,
    draftRevisionId: profileRow?.draft_revision_id ?? null,
    publishedAt: profileRow?.published_at ?? now,
    updatedAt: profileRow?.updated_at ?? now,
  };

  const hero: VersionedEntityRecord<HeroContent> = {
    entityType: "hero_content",
    entityId: "singleton",
    status: (heroRow?.status as ContentStatusDb) ?? "published",
    publishedData: (heroRow?.published_data as unknown as HeroContent) ?? INITIAL_HERO,
    draftData: (heroRow?.draft_data as unknown as HeroContent) ?? INITIAL_HERO,
    publishedRevisionId: heroRow?.published_revision_id ?? null,
    draftRevisionId: heroRow?.draft_revision_id ?? null,
    publishedAt: heroRow?.published_at ?? now,
    updatedAt: heroRow?.updated_at ?? now,
  };

  const about: VersionedEntityRecord<AboutContent> = {
    entityType: "about_content",
    entityId: "singleton",
    status: (aboutRow?.status as ContentStatusDb) ?? "published",
    publishedData: (aboutRow?.published_data as unknown as AboutContent) ?? INITIAL_ABOUT,
    draftData: (aboutRow?.draft_data as unknown as AboutContent) ?? INITIAL_ABOUT,
    publishedRevisionId: aboutRow?.published_revision_id ?? null,
    draftRevisionId: aboutRow?.draft_revision_id ?? null,
    publishedAt: aboutRow?.published_at ?? now,
    updatedAt: aboutRow?.updated_at ?? now,
  };

  const siteSettings: VersionedEntityRecord<SiteSettings> = {
    entityType: "site_settings",
    entityId: "singleton",
    status: (settingsRow?.status as ContentStatusDb) ?? "published",
    publishedData:
      (settingsRow?.published_data as unknown as SiteSettings) ?? INITIAL_SITE_SETTINGS,
    draftData: (settingsRow?.draft_data as unknown as SiteSettings) ?? INITIAL_SITE_SETTINGS,
    publishedRevisionId: settingsRow?.published_revision_id ?? null,
    draftRevisionId: settingsRow?.draft_revision_id ?? null,
    publishedAt: settingsRow?.published_at ?? now,
    updatedAt: settingsRow?.updated_at ?? now,
  };

  const skillCategories: SkillCategory[] = (categoriesRes.data ?? []).map((cat) => {
    const rec = cat as Record<string, unknown>;
    return {
      id: String(cat.id),
      name: String(cat.name),
      nameId: rec.name_id ? String(rec.name_id) : undefined,
      slug: String(cat.slug),
      description: String(cat.description ?? ""),
      descriptionId: rec.description_id ? String(rec.description_id) : undefined,
      displayOrder: Number(cat.display_order ?? 0),
      isEnabled: Boolean(cat.is_enabled),
      skills: Array.isArray(cat.skills)
        ? cat.skills.map((s) => ({
            id: String(s.id),
            categoryId: String(s.category_id),
            name: String(s.name),
            proficiency: s.proficiency as SkillCategory["skills"][number]["proficiency"],
            isEnabled: Boolean(s.is_enabled),
            displayOrder: Number(s.display_order ?? 0),
            status: s.status as SkillCategory["skills"][number]["status"],
          }))
        : [],
    };
  });

  const projects: VersionedEntityRecord<ProjectDetail>[] = (projectsRes.data ?? []).map((p) => ({
    entityType: "project",
    entityId: p.id,
    slug: p.slug,
    status: p.status,
    publishedData: p.published_data as unknown as ProjectDetail | null,
    draftData: p.draft_data as unknown as ProjectDetail,
    publishedRevisionId: p.published_revision_id,
    draftRevisionId: p.draft_revision_id,
    publishedAt: p.published_at,
    updatedAt: p.updated_at,
  }));

  const experiences: VersionedEntityRecord<ExperienceItem>[] = (experiencesRes.data ?? []).map(
    (e) => ({
      entityType: "experience",
      entityId: e.id,
      status: e.status,
      publishedData: e.published_data as unknown as ExperienceItem | null,
      draftData: e.draft_data as unknown as ExperienceItem,
      publishedRevisionId: e.published_revision_id,
      draftRevisionId: null,
      publishedAt: null,
      updatedAt: e.updated_at,
    }),
  );

  const educations: VersionedEntityRecord<EducationItem>[] = (educationsRes.data ?? []).map(
    (e) => ({
      entityType: "education",
      entityId: e.id,
      status: e.status,
      publishedData: e.published_data as unknown as EducationItem | null,
      draftData: e.draft_data as unknown as EducationItem,
      publishedRevisionId: e.published_revision_id,
      draftRevisionId: null,
      publishedAt: null,
      updatedAt: e.updated_at,
    }),
  );

  const certifications: VersionedEntityRecord<CertificationItem>[] = (
    certificationsRes.data ?? []
  ).map((c) => ({
    entityType: "certification",
    entityId: c.id,
    status: c.status,
    publishedData: c.published_data as unknown as CertificationItem | null,
    draftData: c.draft_data as unknown as CertificationItem,
    publishedRevisionId: c.published_revision_id,
    draftRevisionId: null,
    publishedAt: null,
    updatedAt: c.updated_at,
  }));

  const notes: VersionedEntityRecord<EngineeringNote>[] = (notesRes.data ?? []).map((n) => ({
    entityType: "note",
    entityId: n.id,
    slug: n.slug,
    status: n.status,
    publishedData: n.published_data as unknown as EngineeringNote | null,
    draftData: n.draft_data as unknown as EngineeringNote,
    publishedRevisionId: n.published_revision_id,
    draftRevisionId: null,
    publishedAt: n.published_at,
    updatedAt: n.updated_at,
  }));

  const bootGreetings: BootGreeting[] = (greetingsRes.data ?? []).map((g) => ({
    id: String(g.id),
    language: String(g.language),
    greeting: String(g.greeting),
    meaning: String(g.meaning),
    meaningId: g.meaning_id ? String(g.meaning_id) : undefined,
    regionNote: g.region_note ? String(g.region_note) : undefined,
    regionNoteId: g.region_note_id ? String(g.region_note_id) : undefined,
    isEnabled: Boolean(g.is_enabled),
    displayOrder: Number(g.display_order ?? 0),
    status: g.status as BootGreeting["status"],
  }));

  const mediaAssets: MediaAssetRecord[] = (mediaRes.data ?? []).map((m) => ({
    id: m.id,
    bucket: m.bucket,
    storagePath: m.storage_path,
    publicUrl: m.public_url,
    fileName: m.file_name,
    mimeType: m.mime_type,
    sizeBytes: Number(m.size_bytes),
    altText: m.alt_text,
    isPublic: m.is_public,
    createdAt: m.created_at,
  }));

  const resumeFiles: ResumeFileRecord[] = (resumeRes.data ?? []).map((r) => ({
    id: r.id,
    versionLabel: r.version_label,
    fileName: r.file_name,
    storagePath: r.storage_path,
    fileUrl: r.file_url,
    sizeBytes: Number(r.size_bytes),
    summaryNote: r.summary_note,
    isActive: r.is_active,
    status: r.status as ResumeFileRecord["status"],
    updatedAt: r.updated_at,
  }));

  const revisions: RevisionRecord<unknown>[] = (revisionsRes.data ?? []).map((r) => ({
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    versionNumber: r.version_number,
    state: r.state,
    snapshot: r.snapshot,
    changeSummary: r.change_summary,
    createdBy: r.created_by ?? "",
    createdAt: r.created_at,
  }));

  const publications: PublicationRecord[] = (pubsRes.data ?? []).map((p) => ({
    id: p.id,
    entityType: p.entity_type,
    entityId: p.entity_id,
    revisionId: p.revision_id,
    action: p.action,
    publishedBy: p.published_by ?? "",
    publishedAt: p.published_at,
  }));

  const auditLogs: AuditLogEntry[] = (auditRes.data ?? []).map((a) => ({
    id: a.id,
    actorId: a.actor_id ?? "",
    actorEmail: a.actor_email,
    action: a.action,
    entityType: a.entity_type as PublishableEntityType,
    entityId: a.entity_id,
    metadata: (a.metadata as Record<string, unknown>) ?? {},
    createdAt: a.created_at,
  }));

  return {
    adapterMode: "supabase",
    profile,
    hero,
    about,
    siteSettings,
    skillCategories,
    projects,
    experiences,
    educations,
    certifications,
    notes,
    bootGreetings,
    mediaAssets,
    resumeFiles,
    revisions,
    publications,
    auditLogs,
  };
}

/**
 * Supabase Media Asset registration & deletion.
 */
export async function supabaseRegisterMediaAsset(params: {
  admin: VerifiedAdminContext;
  candidate: FileUploadCandidate;
}): Promise<MediaAssetRecord> {
  const validated = validateMediaUpload(params.candidate);
  const supabase = await createSupabaseServerClient();
  const id = crypto.randomUUID();
  const actorId = ensureValidUuid(params.admin.adminId);
  const now = new Date().toISOString();

  const publicUrl = validated.isPublic
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/${validated.storagePath}`
    : null;

  const { error } = await supabase.from("media_assets").insert({
    id,
    bucket: validated.bucket,
    storage_path: validated.storagePath,
    public_url: publicUrl,
    file_name: validated.sanitizedFileName,
    mime_type: validated.mimeType,
    size_bytes: validated.sizeBytes,
    alt_text: validated.altText,
    is_public: validated.isPublic,
    created_by: actorId,
  });

  if (error) {
    throw new Error(`Failed to register media asset in Supabase: ${error.message}`);
  }

  await supabase.from("audit_logs").insert({
    id: crypto.randomUUID(),
    actor_id: actorId,
    actor_email: params.admin.email,
    action: "upload_media",
    entity_type: "profile",
    entity_id: id,
    metadata: {
      bucket: validated.bucket,
      storagePath: validated.storagePath,
      sizeBytes: validated.sizeBytes,
    },
    created_at: now,
  });

  return {
    id,
    bucket: validated.bucket,
    storagePath: validated.storagePath,
    publicUrl,
    fileName: validated.sanitizedFileName,
    mimeType: validated.mimeType,
    sizeBytes: validated.sizeBytes,
    altText: validated.altText,
    isPublic: validated.isPublic,
    createdAt: now,
  };
}

export async function supabaseDeleteMediaAsset(params: {
  admin: VerifiedAdminContext;
  mediaId: string;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const mediaId = ensureValidUuid(params.mediaId);
  const actorId = ensureValidUuid(params.admin.adminId);

  const { data: target, error: fetchErr } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", mediaId)
    .maybeSingle();

  if (fetchErr || !target) {
    throw new Error("Media asset not found in Supabase.");
  }

  const { error } = await supabase.from("media_assets").delete().eq("id", mediaId);
  if (error) {
    throw new Error(`Failed to delete media asset: ${error.message}`);
  }

  await supabase.from("audit_logs").insert({
    id: crypto.randomUUID(),
    actor_id: actorId,
    actor_email: params.admin.email,
    action: "delete_media",
    entity_type: "profile",
    entity_id: mediaId,
    metadata: { fileName: target.file_name, storagePath: target.storage_path },
    created_at: new Date().toISOString(),
  });
}

/**
 * Supabase Resume Version operations.
 */
export async function supabaseUploadResumeVersion(params: {
  admin: VerifiedAdminContext;
  versionLabel: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  summaryNote: string;
}): Promise<ResumeFileRecord> {
  const validated = validateMediaUpload({
    bucket: "resume",
    fileName: params.fileName,
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
  });

  const supabase = await createSupabaseServerClient();
  const id = crypto.randomUUID();
  const actorId = ensureValidUuid(params.admin.adminId);
  const now = new Date().toISOString();

  const { error } = await supabase.from("resume_files").insert({
    id,
    version_label: params.versionLabel.trim() || "v1.0",
    file_name: validated.sanitizedFileName,
    storage_path: validated.storagePath,
    file_url: null,
    size_bytes: validated.sizeBytes,
    summary_note: params.summaryNote.trim(),
    is_active: false,
    status: "draft",
  });

  if (error) {
    throw new Error(`Failed to insert resume version: ${error.message}`);
  }

  await supabase.from("audit_logs").insert({
    id: crypto.randomUUID(),
    actor_id: actorId,
    actor_email: params.admin.email,
    action: "upload_resume_draft",
    entity_type: "resume_file",
    entity_id: id,
    metadata: {
      versionLabel: params.versionLabel,
      fileName: validated.sanitizedFileName,
    },
    created_at: now,
  });

  return {
    id,
    versionLabel: params.versionLabel.trim() || "v1.0",
    fileName: validated.sanitizedFileName,
    storagePath: validated.storagePath,
    fileUrl: null,
    sizeBytes: validated.sizeBytes,
    summaryNote: params.summaryNote.trim(),
    isActive: false,
    status: "draft",
    updatedAt: now,
  };
}

export async function supabaseSetActivePublishedResume(params: {
  admin: VerifiedAdminContext;
  resumeId: string;
}): Promise<ResumeFileRecord> {
  const supabase = await createSupabaseServerClient();
  const resumeId = ensureValidUuid(params.resumeId);
  const actorId = ensureValidUuid(params.admin.adminId);
  const now = new Date().toISOString();

  // Deactivate all existing published resumes
  await supabase
    .from("resume_files")
    .update({ is_active: false, file_url: null })
    .neq("id", resumeId);

  // Activate and publish the selected resume
  const fileUrl = `/api/resume/download/${resumeId}`;
  const { data, error } = await supabase
    .from("resume_files")
    .update({
      is_active: true,
      status: "published",
      file_url: fileUrl,
      published_at: now,
    })
    .eq("id", resumeId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to activate published resume: ${error?.message || "Record not found"}`);
  }

  await supabase.from("audit_logs").insert({
    id: crypto.randomUUID(),
    actor_id: actorId,
    actor_email: params.admin.email,
    action: "publish_active_resume",
    entity_type: "resume_file",
    entity_id: resumeId,
    metadata: { versionLabel: data.version_label },
    created_at: now,
  });

  return {
    id: data.id,
    versionLabel: data.version_label,
    fileName: data.file_name,
    storagePath: data.storage_path,
    fileUrl: data.file_url,
    sizeBytes: Number(data.size_bytes),
    summaryNote: data.summary_note,
    isActive: data.is_active,
    status: data.status as ResumeFileRecord["status"],
    updatedAt: data.updated_at,
  };
}

export async function supabaseDeleteResumeVersion(params: {
  admin: VerifiedAdminContext;
  resumeId: string;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const resumeId = ensureValidUuid(params.resumeId);
  const actorId = ensureValidUuid(params.admin.adminId);

  const { data: target } = await supabase
    .from("resume_files")
    .select("*")
    .eq("id", resumeId)
    .maybeSingle();

  const { error } = await supabase.from("resume_files").delete().eq("id", resumeId);
  if (error) {
    throw new Error(`Failed to delete resume: ${error.message}`);
  }

  await supabase.from("audit_logs").insert({
    id: crypto.randomUUID(),
    actor_id: actorId,
    actor_email: params.admin.email,
    action: "delete_resume",
    entity_type: "resume_file",
    entity_id: resumeId,
    metadata: { versionLabel: target?.version_label, fileName: target?.file_name },
    created_at: new Date().toISOString(),
  });
}

/**
 * Supabase Skills and Categories management.
 */
export async function supabaseSaveSkillCategory(params: {
  admin: VerifiedAdminContext;
  category: SkillCategory;
}): Promise<SkillCategory> {
  const supabase = await createSupabaseServerClient();
  const catId = ensureValidUuid(params.category.id);
  const actorId = ensureValidUuid(params.admin.adminId);

  const payloadWithLoc: Database["public"]["Tables"]["skill_categories"]["Insert"] = {
    id: catId,
    name: params.category.name,
    name_id: params.category.nameId || "",
    slug: params.category.slug,
    description: params.category.description || "",
    description_id: params.category.descriptionId || "",
    display_order: params.category.displayOrder,
    is_enabled: params.category.isEnabled,
  };

  let { error: catErr } = await supabase.from("skill_categories").upsert(payloadWithLoc);
  if (catErr && (catErr.message.includes("name_id") || catErr.message.includes("description_id"))) {
    const payloadCompat: Database["public"]["Tables"]["skill_categories"]["Insert"] = {
      id: catId,
      name: params.category.name,
      slug: params.category.slug,
      description: params.category.description || "",
      display_order: params.category.displayOrder,
      is_enabled: params.category.isEnabled,
    };
    const retryRes = await supabase.from("skill_categories").upsert(payloadCompat);
    catErr = retryRes.error;
  }

  if (catErr) {
    throw new Error(`Failed to save skill category: ${catErr.message}`);
  }

  // Upsert child skills
  for (const skill of params.category.skills) {
    const skillId = ensureValidUuid(skill.id);
    await supabase.from("skills").upsert({
      id: skillId,
      category_id: catId,
      name: skill.name,
      proficiency: skill.proficiency ?? null,
      is_enabled: skill.isEnabled,
      display_order: skill.displayOrder,
      status: (skill.status as ContentStatusDb) ?? "published",
    });
  }

  await supabase.from("audit_logs").insert({
    id: crypto.randomUUID(),
    actor_id: actorId,
    actor_email: params.admin.email,
    action: "save_skill_category",
    entity_type: "skill_category",
    entity_id: catId,
    metadata: { name: params.category.name, skillCount: params.category.skills.length },
    created_at: new Date().toISOString(),
  });

  return {
    ...params.category,
    id: catId,
  };
}

export async function supabaseDeleteSkillCategory(params: {
  admin: VerifiedAdminContext;
  categoryId: string;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const catId = ensureValidUuid(params.categoryId);
  const actorId = ensureValidUuid(params.admin.adminId);

  const { error } = await supabase.from("skill_categories").delete().eq("id", catId);
  if (error) {
    throw new Error(`Failed to delete skill category: ${error.message}`);
  }

  await supabase.from("audit_logs").insert({
    id: crypto.randomUUID(),
    actor_id: actorId,
    actor_email: params.admin.email,
    action: "delete_skill_category",
    entity_type: "skill_category",
    entity_id: catId,
    metadata: {},
    created_at: new Date().toISOString(),
  });
}

/**
 * Supabase Boot Greeting management.
 */
export async function supabaseSaveBootGreeting(params: {
  admin: VerifiedAdminContext;
  greeting: BootGreeting;
}): Promise<BootGreeting> {
  const supabase = await createSupabaseServerClient();
  const id = ensureValidUuid(params.greeting.id);
  const actorId = ensureValidUuid(params.admin.adminId);

  const payloadWithLoc: Database["public"]["Tables"]["boot_greetings"]["Insert"] = {
    id,
    language: params.greeting.language,
    greeting: params.greeting.greeting,
    meaning: params.greeting.meaning,
    meaning_id: params.greeting.meaningId ?? "",
    region_note: params.greeting.regionNote ?? "",
    region_note_id: params.greeting.regionNoteId ?? "",
    is_enabled: params.greeting.isEnabled,
    display_order: params.greeting.displayOrder,
    status: (params.greeting.status as ContentStatusDb) ?? "published",
  };

  let { error } = await supabase.from("boot_greetings").upsert(payloadWithLoc);
  if (error && (error.message.includes("meaning_id") || error.message.includes("region_note_id"))) {
    const payloadCompat: Database["public"]["Tables"]["boot_greetings"]["Insert"] = {
      id,
      language: params.greeting.language,
      greeting: params.greeting.greeting,
      meaning: params.greeting.meaning,
      region_note: params.greeting.regionNote ?? "",
      is_enabled: params.greeting.isEnabled,
      display_order: params.greeting.displayOrder,
      status: (params.greeting.status as ContentStatusDb) ?? "published",
    };
    const retryRes = await supabase.from("boot_greetings").upsert(payloadCompat);
    error = retryRes.error;
  }

  if (error) {
    throw new Error(`Failed to save boot greeting: ${error.message}`);
  }

  await supabase.from("audit_logs").insert({
    id: crypto.randomUUID(),
    actor_id: actorId,
    actor_email: params.admin.email,
    action: "save_boot_greeting",
    entity_type: "boot_greeting",
    entity_id: id,
    metadata: { language: params.greeting.language, greeting: params.greeting.greeting },
    created_at: new Date().toISOString(),
  });

  return {
    ...params.greeting,
    id,
  };
}

export async function supabaseDeleteBootGreeting(params: {
  admin: VerifiedAdminContext;
  greetingId: string;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const id = ensureValidUuid(params.greetingId);
  const actorId = ensureValidUuid(params.admin.adminId);

  const { error } = await supabase.from("boot_greetings").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete boot greeting: ${error.message}`);
  }

  await supabase.from("audit_logs").insert({
    id: crypto.randomUUID(),
    actor_id: actorId,
    actor_email: params.admin.email,
    action: "delete_boot_greeting",
    entity_type: "boot_greeting",
    entity_id: id,
    metadata: {},
    created_at: new Date().toISOString(),
  });
}

export async function supabaseDeleteEntityPreservingHistory(params: {
  admin: VerifiedAdminContext;
  entityType: PublishableEntityType;
  entityId: string;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const actorId = ensureValidUuid(params.admin.adminId);
  const isUuid = /^[0-9a-f-]{36}$/i.test(params.entityId);

  if (params.entityType === "project") {
    if (isUuid) {
      await supabase.from("projects").delete().eq("id", params.entityId);
    } else {
      await supabase.from("projects").delete().eq("slug", params.entityId);
    }
  } else if (params.entityType === "experience") {
    await supabase.from("experiences").delete().eq("id", ensureValidUuid(params.entityId));
  } else if (params.entityType === "education") {
    await supabase.from("educations").delete().eq("id", ensureValidUuid(params.entityId));
  } else if (params.entityType === "certification") {
    await supabase.from("certifications").delete().eq("id", ensureValidUuid(params.entityId));
  } else if (params.entityType === "note") {
    if (isUuid) {
      await supabase.from("notes").delete().eq("id", params.entityId);
    } else {
      await supabase.from("notes").delete().eq("slug", params.entityId);
    }
  }

  // Audit logs and revision history are intentionally preserved!
  await supabase.from("audit_logs").insert({
    id: crypto.randomUUID(),
    actor_id: actorId,
    actor_email: params.admin.email,
    action: "delete_entity",
    entity_type: params.entityType,
    entity_id: params.entityId,
    metadata: { historyPreserved: true },
    created_at: new Date().toISOString(),
  });
}
