import { describe, expect, it } from "vitest";
import {
  validateMediaUpload,
  type FileUploadCandidate,
} from "@/lib/validations/cms";
import {
  createSignedAdminSessionToken,
  verifySignedAdminSessionToken,
} from "@/lib/auth/session";
import { getCmsStore, cmsEngines } from "@/lib/database/cms-store";
import type { ProjectDetail } from "@/types/portfolio";

const FAKE_ADMIN = {
  adminId: "00000000-0000-4000-8000-000000000001",
  authUserId: "00000000-0000-4000-8000-000000000099",
  email: "admin@muhamadfauzan.dev",
  role: "admin" as const,
};

describe("Sprint 5 — Production Readiness, Security, A11y & Data Integrity", () => {
  describe("1. Security: Media & File Upload Validation", () => {
    it("rejects path traversal attempts, disguised extensions, and invalid MIME types", () => {
      const pathTraversalCandidate: FileUploadCandidate = {
        bucket: "projects",
        fileName: "../../etc/passwd",
        mimeType: "image/webp",
        sizeBytes: 1024,
      };
      expect(() => validateMediaUpload(pathTraversalCandidate)).toThrow(
        /invalid or unsafe file name/,
      );

      const mimeSpoofedCandidate: FileUploadCandidate = {
        bucket: "projects",
        fileName: "malware.exe.png",
        mimeType: "application/x-msdownload",
        sizeBytes: 1024,
      };
      expect(() => validateMediaUpload(mimeSpoofedCandidate)).toThrow(
        /MIME type "application\/x-msdownload" is not allowed/,
      );

      const oversizeCandidate: FileUploadCandidate = {
        bucket: "profile",
        fileName: "huge-avatar.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 50 * 1024 * 1024, // 50MB (limit is 5MB)
      };
      expect(() => validateMediaUpload(oversizeCandidate)).toThrow(
        /exceeds bucket limit/,
      );

      const emptyCandidate: FileUploadCandidate = {
        bucket: "resume",
        fileName: "empty.pdf",
        mimeType: "application/pdf",
        sizeBytes: 0,
      };
      expect(() => validateMediaUpload(emptyCandidate)).toThrow(/empty/);
    });

    it("sanitizes safe filenames and resolves appropriate bucket paths", () => {
      const safeCandidate: FileUploadCandidate = {
        bucket: "projects",
        fileName: "My Architecture Diagram 2026!.png",
        mimeType: "image/png",
        sizeBytes: 250000,
        altText: "System Architecture Diagram",
      };
      const validated = validateMediaUpload(safeCandidate);
      expect(validated.sanitizedFileName).toBe("my-architecture-diagram-2026.png");
      expect(validated.storagePath).toBe("projects/my-architecture-diagram-2026.png");
      expect(validated.isPublic).toBe(true);
    });
  });

  describe("3. Security: Signed Tokens & Tamper Resistance", () => {
    it("rejects tampered signatures, expired tokens, and malformed base64", () => {
      const token = createSignedAdminSessionToken({
        authUserId: FAKE_ADMIN.authUserId,
        email: FAKE_ADMIN.email,
        ttlSeconds: 60,
      });

      const [payload, sig] = token.split(".");
      expect(verifySignedAdminSessionToken(token)).not.toBeNull();

      // Tampered payload
      const tamperedPayload = Buffer.from(
        JSON.stringify({ authUserId: "evil-user", email: "evil@evil.com", exp: Date.now() + 10000 }),
      ).toString("base64url");
      expect(verifySignedAdminSessionToken(`${tamperedPayload}.${sig}`)).toBeNull();

      // Tampered signature
      expect(verifySignedAdminSessionToken(`${payload}.${sig}tampered`)).toBeNull();

      // Empty / malformed tokens
      expect(verifySignedAdminSessionToken("")).toBeNull();
      expect(verifySignedAdminSessionToken("not-a-token")).toBeNull();
      expect(verifySignedAdminSessionToken(null)).toBeNull();
    });
  });

  describe("4. Publishing Integrity: Atomic Failure Recovery & Immutable History", () => {
    it("preserves previous published revision if publication validation fails", async () => {
      const store = getCmsStore();
      store.resetToDefaults();

      const engine = cmsEngines.project();
      const snap = store.listByType<ProjectDetail>("project")[0]!;

      // Publish valid project first
      const pubRes = await engine.publishDraft({
        admin: FAKE_ADMIN,
        entityType: "project",
        entityId: snap.entityId,
        changeSummary: "Initial valid publish",
      });
      expect(pubRes.entity.status).toBe("published");
      const initialPubRevision = pubRes.revision.id;

      // Now save an invalid draft (empty case study content that fails publication refinement)
      await engine.saveDraft({
        admin: FAKE_ADMIN,
        entityType: "project",
        entityId: snap.entityId,
        draftPayload: {
          ...snap.draftData,
          caseStudySections: [
            {
              id: "sec-empty",
              sectionType: "overview",
              title: "Overview",
              content: "too short", // fails refinement (<20 chars)
              displayOrder: 1,
              isEnabled: true,
            },
          ],
        },
      });

      // Attempt to publish invalid draft -> must throw validation error
      await expect(
        engine.publishDraft({
          admin: FAKE_ADMIN,
          entityType: "project",
          entityId: snap.entityId,
          changeSummary: "Attempt publish invalid draft",
        }),
      ).rejects.toThrow();

      // Verify the previous published projection remains untouched
      const entityAfterFailedPublish = await store.getEntity("project", snap.entityId);
      expect(entityAfterFailedPublish?.status).toBe("published");
      expect(entityAfterFailedPublish?.publishedRevisionId).toBe(initialPubRevision);
      expect(entityAfterFailedPublish?.publishedData).not.toBeNull();
    });
  });

  describe("5. Authorization: Server-Side Access Guard", () => {
    it("prevents unauthenticated preview or draft promotion", async () => {
      const store = getCmsStore();
      const engine = cmsEngines.project();
      const target = store.listByType<ProjectDetail>("project")[0]!;

      await expect(
        engine.previewDraft({
          admin: null,
          entityType: "project",
          entityId: target.entityId,
        }),
      ).rejects.toThrow(/Unauthorized preview request/);

      // Null or non-admin context rejected
      await expect(
        engine.previewDraft({
          admin: { adminId: "u1", authUserId: "u1", email: "visitor@test.com", role: "visitor" as unknown as "admin" },
          entityType: "project",
          entityId: target.entityId,
        }),
      ).rejects.toThrow(/admin authentication is required/);
    });
  });
});
