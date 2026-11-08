import { describe, expect, it } from "vitest";
import { buildPublicSitemap } from "@/app/sitemap";
import robots from "@/app/robots";
import { buildPortfolioStructuredData } from "@/lib/seo/structured-data";
import { FixturePortfolioRepository } from "@/lib/database/repository";
import { INITIAL_PROFILE, INITIAL_SITE_SETTINGS, INITIAL_PROJECTS } from "@/lib/database/fixtures";

describe("Single-Page Portfolio — Sitemap, Robots & Structured Data", () => {
  it("strictly includes only the single root URL in sitemap.ts and excludes all legacy multi-page routes", async () => {
    const defaultRepo = new FixturePortfolioRepository();
    const entries = await buildPublicSitemap(defaultRepo);
    const urls = entries.map((e) => e.url);

    // Only root URL is present
    expect(urls).toEqual(["http://localhost:3000/"]);
    expect(entries[0]?.priority).toBe(1.0);

    // Legacy multi-page routes are strictly excluded
    expect(urls).not.toContain("http://localhost:3000/projects");
    expect(urls).not.toContain("http://localhost:3000/about");
    expect(urls).not.toContain("http://localhost:3000/notes");
    expect(urls).not.toContain("http://localhost:3000/resume");
    expect(urls).not.toContain("http://localhost:3000/contact");

    for (const project of INITIAL_PROJECTS) {
      expect(urls).not.toContain(`http://localhost:3000/projects/${project.slug}`);
    }
  });

  it("generates accurate robots.ts pointing to sitemap.xml", () => {
    const robotsConfig = robots();
    expect(robotsConfig.sitemap).toBe("http://localhost:3000/sitemap.xml");
  });

  it("generates JSON-LD structured data without fabricated claims", () => {
    const jsonLd = buildPortfolioStructuredData({
      profile: INITIAL_PROFILE,
      siteSettings: INITIAL_SITE_SETTINGS,
    });
    expect(jsonLd["@context"]).toBe("https://schema.org");
    const person = jsonLd["@graph"][0];
    expect(person?.["@type"]).toBe("Person");
    expect(person?.["name"]).toBe("Muhamad Fauzan");
    expect(person?.["jobTitle"]).toBe("Software Engineer");
    expect(person?.["worksFor"]).toBeUndefined();
  });
});
