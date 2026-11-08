import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  ensureValidUuid,
  deterministicUuid,
  CMS_IDENTITY_NAMESPACE,
} from "@/lib/database/supabase-cms-store";
import {
  createSignedAdminSessionToken,
  verifySignedAdminSessionToken,
  getSigningSecret,
} from "@/lib/auth/session";

describe("Supabase Remediation Round 2 Verification", () => {
  describe("Priority 1: UUID Identity Consistency (ensureValidUuid)", () => {
    it("guarantees 100% determinism for arbitrary string identifiers", () => {
      const input = "exp-lead-software-engineer-2026";
      const id1 = ensureValidUuid(input);
      const id2 = ensureValidUuid(input);
      const id3 = ensureValidUuid(input);

      expect(id1).toBe(id2);
      expect(id2).toBe(id3);
      expect(id1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("differentiates different string identifiers with zero collisions", () => {
      const idA = ensureValidUuid("project-geoentity");
      const idB = ensureValidUuid("project-claycv");
      const idC = ensureValidUuid("project-spk-bansos");

      expect(idA).not.toBe(idB);
      expect(idB).not.toBe(idC);
      expect(idA).not.toBe(idC);
    });

    it("preserves valid UUIDs verbatim without re-hashing", () => {
      const originalUuid = "20000000-0000-4000-8000-000000000001";
      const result = ensureValidUuid(originalUuid);
      expect(result).toBe(originalUuid);

      const uppercaseUuid = "A0B1C2D3-E4F5-4A6B-8C7D-9E0F1A2B3C4D";
      expect(ensureValidUuid(uppercaseUuid)).toBe(uppercaseUuid.toLowerCase());
    });

    it("ensures foreign keys and parent entity IDs map identically", () => {
      const categoryRawId = "cat-programming-languages";
      const parentId = ensureValidUuid(categoryRawId);
      const childForeignKey = ensureValidUuid(categoryRawId);

      expect(parentId).toBe(childForeignKey);
    });

    it("conforms strictly to RFC 4122 UUID v5 specification", () => {
      const testName = "test-rfc-4122-compliance";
      const uuid = deterministicUuid(testName, CMS_IDENTITY_NAMESPACE);

      // Octet 6 must indicate version 5
      const versionChar = uuid.split("-")[2]?.[0];
      expect(versionChar).toBe("5");

      // Octet 8 must indicate RFC 4122 variant (8, 9, a, or b)
      const variantChar = uuid.split("-")[3]?.[0]?.toLowerCase();
      expect(["8", "9", "a", "b"]).toContain(variantChar);
    });
  });

  describe("Priority 2 & 3: Seed Idempotency & Production Domain", () => {
    const seedPath = path.resolve(process.cwd(), "supabase/seed.sql");
    const seedSql = fs.readFileSync(seedPath, "utf8");

    it("does not contain any localhost:3000 URLs in published configurations", () => {
      expect(seedSql).not.toContain('"websiteUrl": "http://localhost:3000"');
      expect(seedSql).not.toContain('"canonicalBaseUrl": "http://localhost:3000"');
      expect(seedSql).toContain('"websiteUrl": "https://muhamadfauzan.dev"');
      expect(seedSql).toContain('"canonicalBaseUrl": "https://muhamadfauzan.dev"');
    });

    it("ensures boot_greetings has explicit static UUIDs and ON CONFLICT (id) DO NOTHING", () => {
      expect(seedSql).toMatch(
        /INSERT INTO public\.boot_greetings\s*\([^)]*id[^)]*\)/i,
      );
      expect(seedSql).toContain("10000000-0000-4000-8000-000000000001");
      expect(seedSql).toContain("10000000-0000-4000-8000-000000000010");
      expect(seedSql).toMatch(/ON CONFLICT\s*\(id\)\s*DO NOTHING/i);
    });

    it("ensures skills has explicit static UUIDs and ON CONFLICT (id) DO NOTHING", () => {
      expect(seedSql).toMatch(
        /INSERT INTO public\.skills\s*\([^)]*id[^)]*\)/i,
      );
      expect(seedSql).toContain("21000000-0000-4000-8000-000000000001");
      expect(seedSql).toContain("21000000-0000-4000-8000-000000000033");
    });

    it("verifies migration 00004 defines unique indexes for idempotency defense-in-depth", () => {
      const migPath = path.resolve(
        process.cwd(),
        "supabase/migrations/00004_idempotency_unique_indexes.sql",
      );
      expect(fs.existsSync(migPath)).toBe(true);
      const migSql = fs.readFileSync(migPath, "utf8");

      expect(migSql).toContain("CREATE UNIQUE INDEX IF NOT EXISTS idx_boot_greetings_language_unique");
      expect(migSql).toContain("CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_category_name_unique");
    });

    it("strictly maintains GeoEntity, ClayCV, and SPK Bansos SAW as draft", () => {
      // Find project insert block
      const projectInsert = seedSql.slice(seedSql.indexOf("INSERT INTO public.projects"));
      expect(projectInsert).toContain("'GeoEntity'");
      expect(projectInsert).toContain("'ClayCV'");
      expect(projectInsert).toContain("'SPK Bansos SAW'");

      // Extract all status values in projects insert
      const statuses = (projectInsert.match(/'(draft|published|archived)'/g) || []).slice(0, 3);
      for (const st of statuses) {
        expect(st).toBe("'draft'");
      }
    });
  });

  describe("Priority 4: Session Secret Isolation", () => {
    const savedEnv = { ...process.env };
    const env = process.env as Record<string, string | undefined>;

    afterEach(() => {
      for (const k of Object.keys(process.env)) {
        if (!(k in savedEnv)) {
          delete process.env[k];
        }
      }
      Object.assign(process.env, savedEnv);
    });

    it("throws a Security violation error in production when ADMIN_SESSION_SECRET is missing", () => {
      env.NODE_ENV = "production";
      delete process.env.ADMIN_SESSION_SECRET;
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key-that-must-not-be-used";

      expect(() => getSigningSecret()).toThrow(/Security violation: ADMIN_SESSION_SECRET must be configured/);
    });

    it("throws a Security violation error when DATA_ADAPTER_MODE=supabase and ADMIN_SESSION_SECRET is missing", () => {
      env.NODE_ENV = "development";
      process.env.DATA_ADAPTER_MODE = "supabase";
      delete process.env.ADMIN_SESSION_SECRET;
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key-that-must-not-be-used";

      expect(() => getSigningSecret()).toThrow(/Security violation: ADMIN_SESSION_SECRET must be configured/);
    });

    it("never falls back to SUPABASE_SERVICE_ROLE_KEY for HMAC signing", () => {
      env.NODE_ENV = "production";
      delete process.env.ADMIN_SESSION_SECRET;
      process.env.SUPABASE_SERVICE_ROLE_KEY = "super-secret-service-role-key-sample-1234567890";

      expect(() => getSigningSecret()).toThrow(/Security violation/);
    });

    it("successfully creates and verifies tokens when a valid standalone ADMIN_SESSION_SECRET is configured", () => {
      env.NODE_ENV = "production";
      process.env.ADMIN_SESSION_SECRET = "super-secure-admin-session-secret-at-least-32-chars-long";

      const token = createSignedAdminSessionToken({
        authUserId: "user-123",
        email: "admin@muhamadfauzan.dev",
      });

      expect(typeof token).toBe("string");
      expect(token).toContain(".");

      const verified = verifySignedAdminSessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.authUserId).toBe("user-123");
      expect(verified?.email).toBe("admin@muhamadfauzan.dev");
    });

    it("safely returns null when verifying tokens if the secret is missing or invalid", () => {
      env.NODE_ENV = "production";
      delete process.env.ADMIN_SESSION_SECRET;

      // Must safely return null without throwing an unhandled exception
      const verified = verifySignedAdminSessionToken("fake.token");
      expect(verified).toBeNull();
    });
  });

  describe("Priority 5: Resume Download Handler (GET route)", () => {
    it("returns 404 in fixture mode when resume ID does not exist", async () => {
      process.env.DATA_ADAPTER_MODE = "fixture";
      const req = new Request("http://localhost:3000/api/resume/download/non-existent");
      const res = await (await import("@/app/api/resume/download/[id]/route")).GET(req, {
        params: Promise.resolve({ id: "non-existent" }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Resume version not found.");
    });

    it("returns 403 in fixture mode when accessing an unpublished draft without admin session", async () => {
      process.env.DATA_ADAPTER_MODE = "fixture";
      const { getCmsStore } = await import("@/lib/database/cms-store");
      const store = getCmsStore();

      const draftId = "draft-resume-test-1";
      store.resumeFiles.push({
        id: draftId,
        versionLabel: "vDraft",
        fileName: "draft-cv.pdf",
        storagePath: "draft-cv.pdf",
        fileUrl: null,
        sizeBytes: 1000,
        summaryNote: "draft note",
        isActive: false,
        status: "draft",
        updatedAt: new Date().toISOString(),
      });

      const req = new Request(`http://localhost:3000/api/resume/download/${draftId}`);
      const res = await (await import("@/app/api/resume/download/[id]/route")).GET(req, {
        params: Promise.resolve({ id: draftId }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Forbidden/);
    });

    it("serves valid PDF stream in fixture mode when resume is published and active", async () => {
      process.env.DATA_ADAPTER_MODE = "fixture";
      const { getCmsStore } = await import("@/lib/database/cms-store");
      const store = getCmsStore();

      const pubId = "pub-resume-test-1";
      store.resumeFiles.push({
        id: pubId,
        versionLabel: "vLive",
        fileName: "live-cv.pdf",
        storagePath: "live-cv.pdf",
        fileUrl: `/api/resume/download/${pubId}`,
        sizeBytes: 1000,
        summaryNote: "live note",
        isActive: true,
        status: "published",
        updatedAt: new Date().toISOString(),
      });

      const req = new Request(`http://localhost:3000/api/resume/download/${pubId}`);
      const res = await (await import("@/app/api/resume/download/[id]/route")).GET(req, {
        params: Promise.resolve({ id: pubId }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      expect(res.headers.get("Content-Disposition")).toContain('filename="live-cv.pdf"');
      const text = await res.text();
      expect(text).toContain("%PDF-1.4");
    });

    it("serves attachment disposition when ?download=true is requested", async () => {
      process.env.DATA_ADAPTER_MODE = "fixture";
      const { getCmsStore } = await import("@/lib/database/cms-store");
      const store = getCmsStore();

      const pubId = "pub-resume-attachment-test";
      store.resumeFiles.push({
        id: pubId,
        versionLabel: "vLiveAttach",
        fileName: "live-cv.pdf",
        storagePath: "live-cv.pdf",
        fileUrl: `/api/resume/download/${pubId}`,
        sizeBytes: 1000,
        summaryNote: "live note",
        isActive: true,
        status: "published",
        updatedAt: new Date().toISOString(),
      });

      const req = new Request(
        `http://localhost:3000/api/resume/download/${pubId}?download=true`,
      );
      const res = await (
        await import("@/app/api/resume/download/[id]/route")
      ).GET(req, {
        params: Promise.resolve({ id: pubId }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      expect(res.headers.get("Content-Disposition")).toBe(
        'attachment; filename="live-cv.pdf"',
      );
      const text = await res.text();
      expect(text).toContain("%PDF-1.4");
    });

    it("supports active alias /api/resume/download/active", async () => {
      process.env.DATA_ADAPTER_MODE = "fixture";
      const { getCmsStore } = await import("@/lib/database/cms-store");
      const store = getCmsStore();

      const activeId = "pub-resume-active-alias";
      store.resumeFiles = store.resumeFiles.map((r) => ({ ...r, isActive: false }));
      store.resumeFiles.push({
        id: activeId,
        versionLabel: "vActiveAlias",
        fileName: "active-fauzan-cv.pdf",
        storagePath: "active-fauzan-cv.pdf",
        fileUrl: `/api/resume/download/${activeId}`,
        sizeBytes: 2000,
        summaryNote: "active note",
        isActive: true,
        status: "published",
        updatedAt: new Date().toISOString(),
      });

      const req = new Request(
        "http://localhost:3000/api/resume/download/active?download=true",
      );
      const res = await (
        await import("@/app/api/resume/download/[id]/route")
      ).GET(req, {
        params: Promise.resolve({ id: "active" }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Disposition")).toBe(
        'attachment; filename="active-fauzan-cv.pdf"',
      );
    });

    it("returns active resume JSON metadata via /api/resume/active", async () => {
      const res = await (await import("@/app/api/resume/active/route")).GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("activeResume");
    });
  });
});
