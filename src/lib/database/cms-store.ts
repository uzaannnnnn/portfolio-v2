import type { VerifiedAdminContext } from "@/lib/auth/admin-guard";
import {
  ContentPublishingEngine,
  type AuditLogEntry,
  type PublicationRecord,
  type PublishingStoreAdapter,
  type RevisionRecord,
  type VersionedEntityRecord,
} from "@/features/publishing/publishing-engine";
import {
  INITIAL_ABOUT,
  INITIAL_BOOT_GREETINGS,
  INITIAL_CERTIFICATIONS,
  INITIAL_EDUCATIONS,
  INITIAL_EXPERIENCES,
  INITIAL_HERO,
  INITIAL_NOTES,
  INITIAL_PROFILE,
  INITIAL_PROJECTS,
  INITIAL_SITE_SETTINGS,
  INITIAL_SKILL_CATEGORIES,
} from "@/lib/database/fixtures";
import {
  aboutDraftSchema,
  bootGreetingSchema,
  certificationDraftSchema,
  educationDraftSchema,
  experienceDraftSchema,
  heroDraftSchema,
  noteDraftSchema,
  profileDraftSchema,
  projectDraftSchema,
  projectPublishValidationSchema,
  siteSettingsDraftSchema,
  skillCategorySchema,
  validateMediaUpload,
  type FileUploadCandidate,
} from "@/lib/validations/cms";
import type { PublishableEntityType, StorageBucketName } from "@/types/database";
import type {
  AboutContent,
  ActiveResume,
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

export interface MediaAssetRecord {
  id: string;
  bucket: StorageBucketName;
  storagePath: string;
  publicUrl: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  isPublic: boolean;
  createdAt: string;
}

export interface ResumeFileRecord extends ActiveResume {
  storagePath: string;
  sizeBytes: number;
  isActive: boolean;
}

export interface CmsDashboardSnapshot {
  adapterMode: "fixture" | "supabase";
  profile: VersionedEntityRecord<ProfileData>;
  hero: VersionedEntityRecord<HeroContent>;
  about: VersionedEntityRecord<AboutContent>;
  siteSettings: VersionedEntityRecord<SiteSettings>;
  skillCategories: SkillCategory[];
  projects: VersionedEntityRecord<ProjectDetail>[];
  experiences: VersionedEntityRecord<ExperienceItem>[];
  educations: VersionedEntityRecord<EducationItem>[];
  certifications: VersionedEntityRecord<CertificationItem>[];
  notes: VersionedEntityRecord<EngineeringNote>[];
  bootGreetings: BootGreeting[];
  mediaAssets: MediaAssetRecord[];
  resumeFiles: ResumeFileRecord[];
  revisions: RevisionRecord<unknown>[];
  publications: PublicationRecord[];
  auditLogs: AuditLogEntry[];
}

class GlobalCmsMemoryStore implements PublishingStoreAdapter<unknown> {
  public entities = new Map<string, VersionedEntityRecord<unknown>>();
  public skillCategories: SkillCategory[] = structuredClone(INITIAL_SKILL_CATEGORIES);
  public bootGreetings: BootGreeting[] = structuredClone(INITIAL_BOOT_GREETINGS);
  public mediaAssets: MediaAssetRecord[] = [];
  public resumeFiles: ResumeFileRecord[] = [];
  public revisions: RevisionRecord<unknown>[] = [];
  public publications: PublicationRecord[] = [];
  public auditLogs: AuditLogEntry[] = [];

  constructor() {
    this.seedDefaults();
  }

  public resetToDefaults() {
    this.entities.clear();
    this.skillCategories = structuredClone(INITIAL_SKILL_CATEGORIES);
    this.bootGreetings = structuredClone(INITIAL_BOOT_GREETINGS);
    this.mediaAssets = [];
    this.resumeFiles = [];
    this.revisions = [];
    this.publications = [];
    this.auditLogs = [];
    this.seedDefaults();
  }

  private key(entityType: PublishableEntityType, entityId: string): string {
    return `${entityType}:${entityId}`;
  }

  private seedDefaults() {
    const now = "2026-11-06T00:00:00.000Z";

    // Seed singletons as published
    this.entities.set(this.key("profile", "singleton"), {
      entityType: "profile",
      entityId: "singleton",
      status: "published",
      publishedData: structuredClone(INITIAL_PROFILE),
      draftData: structuredClone(INITIAL_PROFILE),
      publishedRevisionId: "rev-profile-initial",
      draftRevisionId: "rev-profile-initial",
      publishedAt: now,
      updatedAt: now,
    });

    this.entities.set(this.key("hero_content", "singleton"), {
      entityType: "hero_content",
      entityId: "singleton",
      status: "published",
      publishedData: structuredClone(INITIAL_HERO),
      draftData: structuredClone(INITIAL_HERO),
      publishedRevisionId: "rev-hero-initial",
      draftRevisionId: "rev-hero-initial",
      publishedAt: now,
      updatedAt: now,
    });

    this.entities.set(this.key("about_content", "singleton"), {
      entityType: "about_content",
      entityId: "singleton",
      status: "published",
      publishedData: structuredClone(INITIAL_ABOUT),
      draftData: structuredClone(INITIAL_ABOUT),
      publishedRevisionId: "rev-about-initial",
      draftRevisionId: "rev-about-initial",
      publishedAt: now,
      updatedAt: now,
    });

    this.entities.set(this.key("site_settings", "singleton"), {
      entityType: "site_settings",
      entityId: "singleton",
      status: "published",
      publishedData: structuredClone(INITIAL_SITE_SETTINGS),
      draftData: structuredClone(INITIAL_SITE_SETTINGS),
      publishedRevisionId: "rev-settings-initial",
      draftRevisionId: "rev-settings-initial",
      publishedAt: now,
      updatedAt: now,
    });

    // Seed initial projects strictly as DRAFT (publishedData = null)
    for (const proj of INITIAL_PROJECTS) {
      this.entities.set(this.key("project", proj.id), {
        entityType: "project",
        entityId: proj.id,
        slug: proj.slug,
        status: "draft",
        publishedData: null,
        draftData: structuredClone(proj),
        publishedRevisionId: null,
        draftRevisionId: `rev-project-${proj.id}-v1`,
        publishedAt: null,
        updatedAt: now,
      });
      this.revisions.push({
        id: `rev-project-${proj.id}-v1`,
        entityType: "project",
        entityId: proj.id,
        versionNumber: 1,
        state: "draft",
        snapshot: structuredClone(proj),
        changeSummary: "Initial seeded draft",
        createdBy: "system-seed",
        createdAt: now,
      });
    }

    for (const exp of INITIAL_EXPERIENCES) {
      this.entities.set(this.key("experience", exp.id), {
        entityType: "experience",
        entityId: exp.id,
        status: exp.status,
        publishedData: exp.status === "published" ? structuredClone(exp) : null,
        draftData: structuredClone(exp),
        publishedRevisionId: null,
        draftRevisionId: null,
        publishedAt: null,
        updatedAt: now,
      });
    }

    for (const edu of INITIAL_EDUCATIONS) {
      this.entities.set(this.key("education", edu.id), {
        entityType: "education",
        entityId: edu.id,
        status: edu.status,
        publishedData: edu.status === "published" ? structuredClone(edu) : null,
        draftData: structuredClone(edu),
        publishedRevisionId: null,
        draftRevisionId: null,
        publishedAt: null,
        updatedAt: now,
      });
    }

    for (const cert of INITIAL_CERTIFICATIONS) {
      this.entities.set(this.key("certification", cert.id), {
        entityType: "certification",
        entityId: cert.id,
        status: cert.status,
        publishedData: cert.status === "published" ? structuredClone(cert) : null,
        draftData: structuredClone(cert),
        publishedRevisionId: null,
        draftRevisionId: null,
        publishedAt: null,
        updatedAt: now,
      });
    }

    for (const note of INITIAL_NOTES) {
      const revId = `rev-note-${note.id}-v1`;
      this.entities.set(this.key("note", note.id), {
        entityType: "note",
        entityId: note.id,
        slug: note.slug,
        status: note.status,
        publishedData: note.status === "published" ? structuredClone(note) : null,
        draftData: structuredClone(note),
        publishedRevisionId: note.status === "published" ? revId : null,
        draftRevisionId: revId,
        publishedAt: note.publishedAt,
        updatedAt: now,
      });
      this.revisions.push({
        id: revId,
        entityType: "note",
        entityId: note.id,
        versionNumber: 1,
        state: note.status,
        snapshot: structuredClone(note),
        changeSummary: "Initial seeded engineering note",
        createdBy: "system-seed",
        createdAt: now,
      });
    }
  }

  async getEntity(
    entityType: PublishableEntityType,
    entityId: string,
  ): Promise<VersionedEntityRecord<unknown> | null> {
    const found = this.entities.get(this.key(entityType, entityId));
    return found ? structuredClone(found) : null;
  }

  async saveEntity(record: VersionedEntityRecord<unknown>): Promise<void> {
    this.entities.set(
      this.key(record.entityType, record.entityId),
      structuredClone(record),
    );
  }

  async getRevisions(
    entityType: PublishableEntityType,
    entityId: string,
  ): Promise<RevisionRecord<unknown>[]> {
    return this.revisions
      .filter((r) => r.entityType === entityType && r.entityId === entityId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async appendRevision(revision: RevisionRecord<unknown>): Promise<void> {
    this.revisions.unshift(structuredClone(revision));
  }

  async appendPublication(publication: PublicationRecord): Promise<void> {
    this.publications.unshift(structuredClone(publication));
  }

  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    this.auditLogs.unshift(structuredClone(entry));
  }

  listByType<T>(entityType: PublishableEntityType): VersionedEntityRecord<T>[] {
    const results: VersionedEntityRecord<T>[] = [];
    for (const record of this.entities.values()) {
      if (record.entityType === entityType) {
        results.push(structuredClone(record) as VersionedEntityRecord<T>);
      }
    }
    return results;
  }

  deleteEntityPreservingHistory(params: {
    admin: VerifiedAdminContext;
    entityType: PublishableEntityType;
    entityId: string;
  }) {
    this.entities.delete(this.key(params.entityType, params.entityId));
    // Audit logs and revision records are intentionally preserved!
    this.auditLogs.unshift({
      id: `audit-del-${Date.now()}`,
      actorId: params.admin.adminId,
      actorEmail: params.admin.email,
      action: "delete_entity",
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: { historyPreserved: true },
      createdAt: new Date().toISOString(),
    });
  }
}

const globalForCms = globalThis as unknown as {
  __mfCmsStore?: GlobalCmsMemoryStore;
};

export function getCmsStore(): GlobalCmsMemoryStore {
  if (!globalForCms.__mfCmsStore) {
    globalForCms.__mfCmsStore = new GlobalCmsMemoryStore();
  }
  return globalForCms.__mfCmsStore;
}

function createTypedEngine<T>(
  validateDraft: (data: T) => T,
  validatePublish: (data: T) => T = validateDraft,
) {
  const store = getCmsStore() as unknown as PublishingStoreAdapter<T>;
  return new ContentPublishingEngine<T>(store, validateDraft, validatePublish, {
    revalidatePath: () => undefined,
    revalidateTag: () => undefined,
  });
}

export const cmsEngines = {
  profile: () =>
    createTypedEngine<ProfileData>((d) => profileDraftSchema.parse(d)),
  hero: () => createTypedEngine<HeroContent>((d) => heroDraftSchema.parse(d)),
  about: () => createTypedEngine<AboutContent>((d) => aboutDraftSchema.parse(d)),
  siteSettings: () =>
    createTypedEngine<SiteSettings>((d) => siteSettingsDraftSchema.parse(d)),
  project: () =>
    createTypedEngine<ProjectDetail>(
      (d) => projectDraftSchema.parse(d),
      (d) => projectPublishValidationSchema.parse(d),
    ),
  experience: () =>
    createTypedEngine<ExperienceItem>((d) => experienceDraftSchema.parse(d)),
  education: () =>
    createTypedEngine<EducationItem>((d) => educationDraftSchema.parse(d)),
  certification: () =>
    createTypedEngine<CertificationItem>((d) =>
      certificationDraftSchema.parse(d),
    ),
  note: () => createTypedEngine<EngineeringNote>((d) => noteDraftSchema.parse(d)),
};

export function getAdminDashboardSnapshot(): CmsDashboardSnapshot {
  const store = getCmsStore();
  const mode =
    process.env.DATA_ADAPTER_MODE === "supabase" ? "supabase" : "fixture";

  const profile = store.entities.get(
    "profile:singleton",
  ) as VersionedEntityRecord<ProfileData>;
  const hero = store.entities.get(
    "hero_content:singleton",
  ) as VersionedEntityRecord<HeroContent>;
  const about = store.entities.get(
    "about_content:singleton",
  ) as VersionedEntityRecord<AboutContent>;
  const siteSettings = store.entities.get(
    "site_settings:singleton",
  ) as VersionedEntityRecord<SiteSettings>;

  return {
    adapterMode: mode,
    profile: structuredClone(profile),
    hero: structuredClone(hero),
    about: structuredClone(about),
    siteSettings: structuredClone(siteSettings),
    skillCategories: structuredClone(store.skillCategories),
    projects: store.listByType<ProjectDetail>("project"),
    experiences: store.listByType<ExperienceItem>("experience"),
    educations: store.listByType<EducationItem>("education"),
    certifications: store.listByType<CertificationItem>("certification"),
    notes: store.listByType<EngineeringNote>("note"),
    bootGreetings: structuredClone(store.bootGreetings).sort(
      (a, b) => a.displayOrder - b.displayOrder,
    ),
    mediaAssets: structuredClone(store.mediaAssets),
    resumeFiles: structuredClone(store.resumeFiles),
    revisions: structuredClone(store.revisions),
    publications: structuredClone(store.publications),
    auditLogs: structuredClone(store.auditLogs),
  };
}

/**
 * Uploads a validated media asset and records an audit entry.
 * Prevents deletion if referenced by any published project, certification, or note.
 */
export function registerMediaAssetInStore(params: {
  admin: VerifiedAdminContext;
  candidate: FileUploadCandidate;
}): MediaAssetRecord {
  const validated = validateMediaUpload(params.candidate);
  const store = getCmsStore();
  const now = new Date().toISOString();

  const record: MediaAssetRecord = {
    id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    bucket: validated.bucket,
    storagePath: validated.storagePath,
    publicUrl: validated.isPublic
      ? `https://storage.muhamadfauzan.dev/${validated.storagePath}`
      : null,
    fileName: validated.sanitizedFileName,
    mimeType: validated.mimeType,
    sizeBytes: validated.sizeBytes,
    altText: validated.altText,
    isPublic: validated.isPublic,
    createdAt: now,
  };

  store.mediaAssets.unshift(record);
  store.auditLogs.unshift({
    id: `audit-media-${Date.now()}`,
    actorId: params.admin.adminId,
    actorEmail: params.admin.email,
    action: "upload_media",
    entityType: "profile",
    entityId: record.id,
    metadata: {
      bucket: record.bucket,
      storagePath: record.storagePath,
      sizeBytes: record.sizeBytes,
    },
    createdAt: now,
  });

  return record;
}

export function deleteMediaAssetFromStore(params: {
  admin: VerifiedAdminContext;
  mediaId: string;
}): void {
  const store = getCmsStore();
  const target = store.mediaAssets.find((m) => m.id === params.mediaId);
  if (!target) {
    throw new Error("Media asset not found.");
  }

  // Reference check against published projects, notes, and certifications
  if (target.publicUrl) {
    const projects = store.listByType<ProjectDetail>("project");
    for (const p of projects) {
      if (
        p.publishedData?.coverUrl === target.publicUrl ||
        p.draftData.coverUrl === target.publicUrl
      ) {
        throw new Error(
          `Cannot delete media asset "${target.fileName}": currently referenced by project "${p.draftData.name}".`,
        );
      }
    }

    const certs = store.listByType<CertificationItem>("certification");
    for (const c of certs) {
      if (
        c.publishedData?.certificateMediaUrl === target.publicUrl ||
        c.draftData.certificateMediaUrl === target.publicUrl
      ) {
        throw new Error(
          `Cannot delete media asset "${target.fileName}": currently referenced by certification "${c.draftData.name}".`,
        );
      }
    }
  }

  store.mediaAssets = store.mediaAssets.filter((m) => m.id !== params.mediaId);
  store.auditLogs.unshift({
    id: `audit-media-del-${Date.now()}`,
    actorId: params.admin.adminId,
    actorEmail: params.admin.email,
    action: "delete_media",
    entityType: "profile",
    entityId: params.mediaId,
    metadata: { fileName: target.fileName, storagePath: target.storagePath },
    createdAt: new Date().toISOString(),
  });
}

/**
 * Resume Manager operations: upload version (private draft by default), set active & publish.
 */
export function uploadResumeVersionToStore(params: {
  admin: VerifiedAdminContext;
  versionLabel: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  summaryNote: string;
}): ResumeFileRecord {
  const validated = validateMediaUpload({
    bucket: "resume",
    fileName: params.fileName,
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
  });

  const store = getCmsStore();
  const now = new Date().toISOString();
  const record: ResumeFileRecord = {
    id: `resume-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    versionLabel: params.versionLabel.trim() || "v1.0",
    fileName: validated.sanitizedFileName,
    storagePath: validated.storagePath,
    fileUrl: null, // Strictly private until published & active
    sizeBytes: validated.sizeBytes,
    summaryNote: params.summaryNote.trim(),
    isActive: false,
    status: "draft",
    updatedAt: now,
  };

  store.resumeFiles.unshift(record);
  store.auditLogs.unshift({
    id: `audit-resume-up-${Date.now()}`,
    actorId: params.admin.adminId,
    actorEmail: params.admin.email,
    action: "upload_resume_draft",
    entityType: "resume_file",
    entityId: record.id,
    metadata: {
      versionLabel: record.versionLabel,
      fileName: record.fileName,
    },
    createdAt: now,
  });

  return record;
}

export function setActivePublishedResumeInStore(params: {
  admin: VerifiedAdminContext;
  resumeId: string;
}): ResumeFileRecord {
  const store = getCmsStore();
  const target = store.resumeFiles.find((r) => r.id === params.resumeId);
  if (!target) {
    throw new Error("Resume version not found.");
  }

  const now = new Date().toISOString();
  store.resumeFiles = store.resumeFiles.map((r) => {
    if (r.id === params.resumeId) {
      return {
        ...r,
        isActive: true,
        status: "published" as const,
        fileUrl: `/api/resume/download/${r.id}`,
        updatedAt: now,
      };
    }
    return {
      ...r,
      isActive: false,
      status: r.status === "published" ? ("archived" as const) : r.status,
      fileUrl: null,
    };
  });

  const updated = store.resumeFiles.find((r) => r.id === params.resumeId)!;
  store.auditLogs.unshift({
    id: `audit-resume-pub-${Date.now()}`,
    actorId: params.admin.adminId,
    actorEmail: params.admin.email,
    action: "publish_active_resume",
    entityType: "resume_file",
    entityId: updated.id,
    metadata: { versionLabel: updated.versionLabel },
    createdAt: now,
  });

  return updated;
}

export function deleteResumeFromStore(params: {
  admin: VerifiedAdminContext;
  resumeId: string;
}): void {
  const store = getCmsStore();
  const target = store.resumeFiles.find((r) => r.id === params.resumeId);
  if (!target) {
    throw new Error("Resume version not found.");
  }
  store.resumeFiles = store.resumeFiles.filter((r) => r.id !== params.resumeId);
  store.auditLogs.unshift({
    id: `audit-resume-del-${Date.now()}`,
    actorId: params.admin.adminId,
    actorEmail: params.admin.email,
    action: "delete_resume",
    entityType: "resume_file",
    entityId: params.resumeId,
    metadata: { versionLabel: target.versionLabel, fileName: target.fileName },
    createdAt: new Date().toISOString(),
  });
}

export function saveSkillCategoryInStore(params: {
  admin: VerifiedAdminContext;
  category: SkillCategory;
}): SkillCategory {
  const validated = skillCategorySchema.parse(params.category);
  const store = getCmsStore();
  const idx = store.skillCategories.findIndex((c) => c.id === validated.id);
  if (idx >= 0) {
    store.skillCategories[idx] = validated;
  } else {
    store.skillCategories.push(validated);
  }
  store.auditLogs.unshift({
    id: `audit-skill-${Date.now()}`,
    actorId: params.admin.adminId,
    actorEmail: params.admin.email,
    action: "save_skill_category",
    entityType: "skill_category",
    entityId: validated.id,
    metadata: { name: validated.name, skillCount: validated.skills.length },
    createdAt: new Date().toISOString(),
  });
  return validated;
}

export function deleteSkillCategoryFromStore(params: {
  admin: VerifiedAdminContext;
  categoryId: string;
}): void {
  const store = getCmsStore();
  store.skillCategories = store.skillCategories.filter(
    (c) => c.id !== params.categoryId,
  );
  store.auditLogs.unshift({
    id: `audit-skill-del-${Date.now()}`,
    actorId: params.admin.adminId,
    actorEmail: params.admin.email,
    action: "delete_skill_category",
    entityType: "skill_category",
    entityId: params.categoryId,
    metadata: {},
    createdAt: new Date().toISOString(),
  });
}

export function saveBootGreetingInStore(params: {
  admin: VerifiedAdminContext;
  greeting: BootGreeting;
}): BootGreeting {
  const validated = bootGreetingSchema.parse(params.greeting);
  const store = getCmsStore();
  const idx = store.bootGreetings.findIndex((g) => g.id === validated.id);
  if (idx >= 0) {
    store.bootGreetings[idx] = validated;
  } else {
    store.bootGreetings.push(validated);
  }
  store.auditLogs.unshift({
    id: `audit-greeting-${Date.now()}`,
    actorId: params.admin.adminId,
    actorEmail: params.admin.email,
    action: "save_boot_greeting",
    entityType: "boot_greeting",
    entityId: validated.id,
    metadata: { language: validated.language, greeting: validated.greeting },
    createdAt: new Date().toISOString(),
  });
  return validated;
}

export function deleteBootGreetingFromStore(params: {
  admin: VerifiedAdminContext;
  greetingId: string;
}): void {
  const store = getCmsStore();
  store.bootGreetings = store.bootGreetings.filter(
    (g) => g.id !== params.greetingId,
  );
  store.auditLogs.unshift({
    id: `audit-greeting-del-${Date.now()}`,
    actorId: params.admin.adminId,
    actorEmail: params.admin.email,
    action: "delete_boot_greeting",
    entityType: "boot_greeting",
    entityId: params.greetingId,
    metadata: {},
    createdAt: new Date().toISOString(),
  });
}
