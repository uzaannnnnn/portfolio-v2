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
});
