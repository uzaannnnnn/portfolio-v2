"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { UnauthorizedAdminError } from "@/lib/auth/admin-guard";
import {
  ADMIN_SESSION_COOKIE_NAME,
  authenticateSingleAdminCredentials,
  enforceAdminSession,
} from "@/lib/auth/session";
import {
  cmsEngines,
  deleteBootGreetingFromStore,
  deleteMediaAssetFromStore,
  deleteResumeFromStore,
  deleteSkillCategoryFromStore,
  getCmsStore,
  registerMediaAssetInStore,
  saveBootGreetingInStore,
  saveSkillCategoryInStore,
  setActivePublishedResumeInStore,
  uploadResumeVersionToStore,
} from "@/lib/database/cms-store";
import type { FileUploadCandidate } from "@/lib/validations/cms";
import type { PublishableEntityType } from "@/types/database";
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

export interface ActionResponse<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
  statusCode?: number;
}

function handleActionError<T = undefined>(err: unknown): ActionResponse<T> {
  if (err instanceof UnauthorizedAdminError) {
    return {
      ok: false,
      message: err.message,
      statusCode: err.statusCode,
    };
  }
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return {
      ok: false,
      message: `Validation error: ${firstIssue?.path.join(".") || "field"} — ${firstIssue?.message ?? "Invalid input"}`,
      statusCode: 400,
    };
  }
  if (err instanceof Error) {
    return {
      ok: false,
      message: err.message,
      statusCode: 400,
    };
  }
  return {
    ok: false,
    message: "An unexpected server error occurred.",
    statusCode: 500,
  };
}

function safeRevalidate(paths: string[]) {
  try {
    for (const p of paths) {
      revalidatePath(p);
    }
  } catch {
    // Ignored outside Next.js request context (e.g., direct Vitest execution)
  }
}

export async function loginAdminAction(params: {
  email: string;
  password: string;
}): Promise<ActionResponse<{ email: string }>> {
  try {
    const { token, admin } = await authenticateSingleAdminCredentials(params);

    if (token) {
      const cookieStore = await cookies();
      cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
    }

    getCmsStore().auditLogs.unshift({
      id: `audit-login-${Date.now()}`,
      actorId: admin.adminId,
      actorEmail: admin.email,
      action: "admin_login",
      entityType: "profile",
      entityId: "singleton",
      metadata: { mode: process.env.DATA_ADAPTER_MODE ?? "fixture" },
      createdAt: new Date().toISOString(),
    });

    return {
      ok: true,
      message: "Authenticated as administrator.",
      data: { email: admin.email },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function logoutAdminAction(): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);

    if (process.env.DATA_ADAPTER_MODE === "supabase") {
      const { createSupabaseServerClient } = await import(
        "@/lib/supabase/server"
      );
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    }

    return { ok: true, message: "Signed out." };
  } catch (err) {
    return handleActionError(err);
  }
}

// ============================================================================
// SINGLETON ACTIONS (Profile, Hero, About, Site Settings)
// ============================================================================

export async function saveProfileDraftAction(
  draft: ProfileData,
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.profile().saveDraft({
      admin,
      entityType: "profile",
      entityId: "singleton",
      draftPayload: draft,
      changeSummary,
    });
    safeRevalidate(["/admin", "/admin/profile"]);
    return {
      ok: true,
      message: "Profile draft saved without modifying live public profile.",
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function publishProfileAction(
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.profile().publishDraft({
      admin,
      entityType: "profile",
      entityId: "singleton",
      changeSummary,
    });
    safeRevalidate(["/", "/admin", "/admin/profile"]);
    return {
      ok: true,
      message: "Profile published to live website.",
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function saveHeroDraftAction(
  draft: HeroContent,
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.hero().saveDraft({
      admin,
      entityType: "hero_content",
      entityId: "singleton",
      draftPayload: draft,
      changeSummary,
    });
    safeRevalidate(["/admin", "/admin/hero"]);
    return {
      ok: true,
      message: "Hero draft saved.",
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function publishHeroAction(
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.hero().publishDraft({
      admin,
      entityType: "hero_content",
      entityId: "singleton",
      changeSummary,
    });
    safeRevalidate(["/", "/admin", "/admin/hero"]);
    return {
      ok: true,
      message: "Hero content published.",
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function saveAboutDraftAction(
  draft: AboutContent,
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.about().saveDraft({
      admin,
      entityType: "about_content",
      entityId: "singleton",
      draftPayload: draft,
      changeSummary,
    });
    safeRevalidate(["/admin", "/admin/about"]);
    return {
      ok: true,
      message: "About & Philosophy draft saved.",
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function publishAboutAction(
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.about().publishDraft({
      admin,
      entityType: "about_content",
      entityId: "singleton",
      changeSummary,
    });
    safeRevalidate(["/", "/admin", "/admin/about"]);
    return {
      ok: true,
      message: "About & Philosophy published.",
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function saveSiteSettingsDraftAction(
  draft: SiteSettings,
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.siteSettings().saveDraft({
      admin,
      entityType: "site_settings",
      entityId: "singleton",
      draftPayload: draft,
      changeSummary,
    });
    safeRevalidate(["/admin", "/admin/settings", "/admin/boot-experience"]);
    return {
      ok: true,
      message: "Site & SEO settings draft saved.",
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function publishSiteSettingsAction(
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.siteSettings().publishDraft({
      admin,
      entityType: "site_settings",
      entityId: "singleton",
      changeSummary,
    });
    safeRevalidate([
      "/",
      "/sitemap.xml",
      "/robots.txt",
      "/admin",
      "/admin/settings",
      "/admin/boot-experience",
    ]);
    return {
      ok: true,
      message: "Site & SEO settings published.",
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

// ============================================================================
// PROJECTS & 14-SECTION CASE STUDY ACTIONS
// ============================================================================

export async function saveProjectDraftAction(
  project: ProjectDetail,
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.project().saveDraft({
      admin,
      entityType: "project",
      entityId: project.id,
      slug: project.slug,
      draftPayload: project,
      changeSummary,
    });
    safeRevalidate(["/admin", "/admin/projects"]);
    return {
      ok: true,
      message: `Draft saved for "${project.name}". Published site remains unchanged.`,
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function publishProjectAction(
  projectId: string,
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.project().publishDraft({
      admin,
      entityType: "project",
      entityId: projectId,
      changeSummary,
    });
    safeRevalidate([
      "/",
      "/projects",
      `/projects/${res.entity.slug}`,
      "/sitemap.xml",
      "/admin",
      "/admin/projects",
    ]);
    return {
      ok: true,
      message: `Project "${res.entity.draftData.name}" published to live portfolio.`,
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function transitionProjectStateAction(params: {
  projectId: string;
  targetState: "draft" | "archived";
}): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.project().transitionPublicationState({
      admin,
      entityType: "project",
      entityId: params.projectId,
      targetState: params.targetState,
    });
    safeRevalidate([
      "/",
      "/projects",
      `/projects/${res.entity.slug}`,
      "/sitemap.xml",
      "/admin",
      "/admin/projects",
    ]);
    return {
      ok: true,
      message:
        params.targetState === "archived"
          ? `Project archived and removed from public pages.`
          : `Project unpublished back to draft.`,
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteProjectAction(
  projectId: string,
): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    getCmsStore().deleteEntityPreservingHistory({
      admin,
      entityType: "project",
      entityId: projectId,
    });
    safeRevalidate(["/", "/projects", "/admin", "/admin/projects"]);
    return {
      ok: true,
      message: "Project deleted. Revision and audit history preserved.",
    };
  } catch (err) {
    return handleActionError(err);
  }
}

// ============================================================================
// SKILLS & CATEGORIES ACTIONS
// ============================================================================

export async function saveSkillCategoryAction(
  category: SkillCategory,
): Promise<ActionResponse<SkillCategory>> {
  try {
    const admin = await enforceAdminSession();
    const saved = saveSkillCategoryInStore({ admin, category });
    safeRevalidate(["/", "/admin", "/admin/skills"]);
    return {
      ok: true,
      message: `Skill category "${saved.name}" saved.`,
      data: saved,
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteSkillCategoryAction(
  categoryId: string,
): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    deleteSkillCategoryFromStore({ admin, categoryId });
    safeRevalidate(["/", "/admin", "/admin/skills"]);
    return {
      ok: true,
      message: "Skill category deleted.",
    };
  } catch (err) {
    return handleActionError(err);
  }
}

// ============================================================================
// EXPERIENCE, EDUCATION, CERTIFICATIONS, & ENGINEERING NOTES ACTIONS
// ============================================================================

export async function saveExperienceDraftAction(
  item: ExperienceItem,
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.experience().saveDraft({
      admin,
      entityType: "experience",
      entityId: item.id,
      draftPayload: item,
      changeSummary,
    });
    safeRevalidate(["/admin", "/admin/experience"]);
    return {
      ok: true,
      message: `Experience draft "${item.role}" saved.`,
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function publishExperienceAction(
  experienceId: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.experience().publishDraft({
      admin,
      entityType: "experience",
      entityId: experienceId,
    });
    safeRevalidate(["/", "/admin", "/admin/experience"]);
    return {
      ok: true,
      message: "Experience entry published.",
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function transitionExperienceStateAction(params: {
  experienceId: string;
  targetState: "draft" | "archived";
}): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    await cmsEngines.experience().transitionPublicationState({
      admin,
      entityType: "experience",
      entityId: params.experienceId,
      targetState: params.targetState,
    });
    safeRevalidate(["/", "/admin", "/admin/experience"]);
    return {
      ok: true,
      message: `Experience state updated to ${params.targetState}.`,
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteExperienceAction(
  experienceId: string,
): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    getCmsStore().deleteEntityPreservingHistory({
      admin,
      entityType: "experience",
      entityId: experienceId,
    });
    safeRevalidate(["/", "/admin", "/admin/experience"]);
    return { ok: true, message: "Experience deleted. Audit history preserved." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function saveEducationDraftAction(
  item: EducationItem,
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.education().saveDraft({
      admin,
      entityType: "education",
      entityId: item.id,
      draftPayload: item,
      changeSummary,
    });
    safeRevalidate(["/admin", "/admin/education"]);
    return {
      ok: true,
      message: `Education draft "${item.institution}" saved.`,
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function publishEducationAction(
  educationId: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.education().publishDraft({
      admin,
      entityType: "education",
      entityId: educationId,
    });
    safeRevalidate(["/", "/admin", "/admin/education"]);
    return {
      ok: true,
      message: "Education entry published.",
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteEducationAction(
  educationId: string,
): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    getCmsStore().deleteEntityPreservingHistory({
      admin,
      entityType: "education",
      entityId: educationId,
    });
    safeRevalidate(["/", "/admin", "/admin/education"]);
    return { ok: true, message: "Education deleted. Audit history preserved." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function saveCertificationDraftAction(
  item: CertificationItem,
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.certification().saveDraft({
      admin,
      entityType: "certification",
      entityId: item.id,
      draftPayload: item,
      changeSummary,
    });
    safeRevalidate(["/admin", "/admin/certifications"]);
    return {
      ok: true,
      message: `Certification draft "${item.name}" saved.`,
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function publishCertificationAction(
  certificationId: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.certification().publishDraft({
      admin,
      entityType: "certification",
      entityId: certificationId,
    });
    safeRevalidate(["/", "/admin", "/admin/certifications"]);
    return {
      ok: true,
      message: "Certification entry published.",
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteCertificationAction(
  certificationId: string,
): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    getCmsStore().deleteEntityPreservingHistory({
      admin,
      entityType: "certification",
      entityId: certificationId,
    });
    safeRevalidate(["/", "/admin", "/admin/certifications"]);
    return {
      ok: true,
      message: "Certification deleted. Audit history preserved.",
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function saveNoteDraftAction(
  note: EngineeringNote,
  changeSummary?: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.note().saveDraft({
      admin,
      entityType: "note",
      entityId: note.id,
      slug: note.slug,
      draftPayload: note,
      changeSummary,
    });
    safeRevalidate(["/admin", "/admin/notes"]);
    return {
      ok: true,
      message: `Note draft "${note.title}" saved.`,
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function publishNoteAction(
  noteId: string,
): Promise<ActionResponse<{ revisionId: string }>> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.note().publishDraft({
      admin,
      entityType: "note",
      entityId: noteId,
    });
    safeRevalidate([
      "/",
      "/notes",
      `/notes/${res.entity.slug}`,
      "/sitemap.xml",
      "/admin",
      "/admin/notes",
    ]);
    return {
      ok: true,
      message: "Engineering Note published.",
      data: { revisionId: res.revision.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function transitionNoteStateAction(params: {
  noteId: string;
  targetState: "draft" | "archived";
}): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    const res = await cmsEngines.note().transitionPublicationState({
      admin,
      entityType: "note",
      entityId: params.noteId,
      targetState: params.targetState,
    });
    safeRevalidate([
      "/",
      "/notes",
      `/notes/${res.entity.slug}`,
      "/sitemap.xml",
      "/admin",
      "/admin/notes",
    ]);
    return {
      ok: true,
      message: `Note state transitioned to ${params.targetState}.`,
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteNoteAction(noteId: string): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    getCmsStore().deleteEntityPreservingHistory({
      admin,
      entityType: "note",
      entityId: noteId,
    });
    safeRevalidate(["/", "/notes", "/admin", "/admin/notes"]);
    return { ok: true, message: "Note deleted. Audit history preserved." };
  } catch (err) {
    return handleActionError(err);
  }
}

// ============================================================================
// INDONESIAN BOOT EXPERIENCE ACTIONS
// ============================================================================

export async function saveBootGreetingAction(
  greeting: BootGreeting,
): Promise<ActionResponse<BootGreeting>> {
  try {
    const admin = await enforceAdminSession();
    const saved = saveBootGreetingInStore({ admin, greeting });
    safeRevalidate(["/", "/admin", "/admin/boot-experience"]);
    return {
      ok: true,
      message: `Regional greeting (${saved.language}) saved.`,
      data: saved,
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteBootGreetingAction(
  greetingId: string,
): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    deleteBootGreetingFromStore({ admin, greetingId });
    safeRevalidate(["/", "/admin", "/admin/boot-experience"]);
    return { ok: true, message: "Regional greeting deleted." };
  } catch (err) {
    return handleActionError(err);
  }
}

// ============================================================================
// MEDIA LIBRARY & RESUME MANAGER ACTIONS
// ============================================================================

export async function uploadMediaAssetAction(
  candidate: FileUploadCandidate,
): Promise<ActionResponse<{ id: string; publicUrl: string | null }>> {
  try {
    const admin = await enforceAdminSession();
    const record = registerMediaAssetInStore({ admin, candidate });
    safeRevalidate(["/admin", "/admin/media"]);
    return {
      ok: true,
      message: `Media asset "${record.fileName}" uploaded to bucket "${record.bucket}".`,
      data: { id: record.id, publicUrl: record.publicUrl },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteMediaAssetAction(
  mediaId: string,
): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    deleteMediaAssetFromStore({ admin, mediaId });
    safeRevalidate(["/admin", "/admin/media"]);
    return { ok: true, message: "Media asset deleted." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function uploadResumeVersionAction(params: {
  versionLabel: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  summaryNote: string;
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const admin = await enforceAdminSession();
    const record = uploadResumeVersionToStore({ admin, ...params });
    safeRevalidate(["/admin", "/admin/resume"]);
    return {
      ok: true,
      message: `Resume version "${record.versionLabel}" uploaded as private draft.`,
      data: { id: record.id },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function publishActiveResumeAction(
  resumeId: string,
): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    const updated = setActivePublishedResumeInStore({ admin, resumeId });
    safeRevalidate(["/", "/admin", "/admin/resume"]);
    return {
      ok: true,
      message: `Resume version "${updated.versionLabel}" is now active and published.`,
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteResumeVersionAction(
  resumeId: string,
): Promise<ActionResponse> {
  try {
    const admin = await enforceAdminSession();
    deleteResumeFromStore({ admin, resumeId });
    safeRevalidate(["/", "/admin", "/admin/resume"]);
    return { ok: true, message: "Resume version deleted." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function previewEntityDraftAction(params: {
  entityType: PublishableEntityType;
  entityId: string;
}): Promise<
  ActionResponse<{
    draftData: unknown;
    currentlyPublishedData: unknown;
    draftRevisionId: string | null;
    publishedRevisionId: string | null;
  }>
> {
  try {
    const admin = await enforceAdminSession();
    const store = getCmsStore();
    const engine = cmsEngines.project(); // Generic preview reader
    const entity = await store.getEntity(params.entityType, params.entityId);
    if (!entity) {
      return { ok: false, message: "Entity not found.", statusCode: 404 };
    }
    const res = await engine.previewDraft({
      admin,
      entityType: params.entityType,
      entityId: params.entityId,
    });
    return {
      ok: true,
      message: "Preview loaded.",
      data: {
        draftData: res.draftData,
        currentlyPublishedData: res.currentlyPublishedData,
        draftRevisionId: res.draftRevisionId,
        publishedRevisionId: res.publishedRevisionId,
      },
    };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function resetCmsStoreToDefaultsAction(): Promise<ActionResponse> {
  try {
    await enforceAdminSession();
    getCmsStore().resetToDefaults();
    safeRevalidate(["/", "/projects", "/notes", "/admin"]);
    return {
      ok: true,
      message: "CMS store reset to default initial fixtures.",
    };
  } catch (err) {
    return handleActionError(err);
  }
}
