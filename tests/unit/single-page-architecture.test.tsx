import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { buildCacheRevalidationPlan } from "@/lib/cache/revalidation";

describe("Single-Page Full-Screen Architecture & Legacy Route Cleanup", () => {
  it("restricts cache revalidation paths strictly to ['/', '/sitemap.xml'] for all publishable entities", () => {
    const profilePlan = buildCacheRevalidationPlan({ entityType: "profile" });
    expect(profilePlan.paths).toEqual(["/", "/sitemap.xml"]);

    const projectPlan = buildCacheRevalidationPlan({
      entityType: "project",
      slug: "geoentity",
    });
    expect(projectPlan.paths).toEqual(["/", "/sitemap.xml"]);
    expect(projectPlan.tags).toContain("project:geoentity");

    const resumePlan = buildCacheRevalidationPlan({ entityType: "resume_file" });
    expect(resumePlan.paths).toEqual(["/", "/sitemap.xml"]);
  });

  it("verifies legacy public route directories have been completely removed from src/app/(public)", () => {
    const publicAppDir = path.resolve(process.cwd(), "src/app/(public)");
    const removedRoutes = ["about", "projects", "notes", "resume", "contact"];

    for (const route of removedRoutes) {
      const routePath = path.join(publicAppDir, route);
      expect(fs.existsSync(routePath)).toBe(false);
    }

    // Only layout.tsx and page.tsx should exist directly inside src/app/(public)
    const remainingFiles = fs.readdirSync(publicAppDir);
    expect(remainingFiles.sort()).toEqual(["layout.tsx", "page.tsx"].sort());
  });

  it("verifies legacy public navigation and footer components have been completely deleted", () => {
    const publicComponentsDir = path.resolve(
      process.cwd(),
      "src/components/public",
    );
    const removedComponents = [
      "public-navbar.tsx",
      "public-footer.tsx",
      "book-page-turn-container.tsx",
      "book-navigation-bar.tsx",
      "book-route-utils.ts",
      "about-header-banner.tsx",
      "contact-header-banner.tsx",
      "note-detail-view.tsx",
      "notes-directory-view.tsx",
      "project-directory.tsx",
      "resume-view.tsx",
      "safe-mdx-renderer.tsx",
      "sections",
    ];

    for (const comp of removedComponents) {
      const compPath = path.join(publicComponentsDir, comp);
      expect(fs.existsSync(compPath)).toBe(false);
    }

    // Case study directory must also be removed
    const caseStudyDir = path.resolve(
      process.cwd(),
      "src/components/case-study",
    );
    expect(fs.existsSync(caseStudyDir)).toBe(false);
  });
});

