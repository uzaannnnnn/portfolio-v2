import { describe, expect, it } from "vitest";
import {
  FixturePortfolioRepository,
  SupabasePortfolioRepository,
  filterAndSortPublicGreetings,
  filterPublishedProjects,
  getPortfolioRepository,
} from "@/lib/database/repository";
import { INITIAL_BOOT_GREETINGS, INITIAL_PROJECTS } from "@/lib/database/fixtures";
import { formatMonthYear, formatPeriodRange } from "@/lib/utils";
import type { BootGreeting } from "@/types/portfolio";

describe("Sprint 1 — Data Access Layer & Draft Isolation", () => {
  it("seeds GeoEntity, ClayCV, and SPK Bansos SAW strictly as DRAFT projects", () => {
    const slugs = INITIAL_PROJECTS.map((p) => p.slug);
    expect(slugs).toEqual(["geoentity", "claycv", "spk-bansos-saw"]);
    for (const project of INITIAL_PROJECTS) {
      expect(project.status).toBe("draft");
    }
  });

  it("never leaks draft projects through public repository queries", async () => {
    const repo = new FixturePortfolioRepository();
    const publishedProjects = await repo.getPublishedProjects();
    expect(publishedProjects).toHaveLength(0);

    const bundle = await repo.getPublicPortfolioBundle();
    expect(bundle.featuredProjects).toHaveLength(0);
    expect(bundle.allPublishedProjects).toHaveLength(0);

    const geoEntity = await repo.getPublishedProjectBySlug("geoentity");
    const clayCv = await repo.getPublishedProjectBySlug("claycv");
    const spk = await repo.getPublishedProjectBySlug("spk-bansos-saw");

    expect(geoEntity).toBeNull();
    expect(clayCv).toBeNull();
    expect(spk).toBeNull();
  });

  it("returns published projects when a project's status is published", () => {
    const sample = [
      ...INITIAL_PROJECTS,
      {
        ...INITIAL_PROJECTS[0]!,
        id: "proj-published-sample",
        slug: "published-sample",
        status: "published" as const,
      },
    ];
    const result = filterPublishedProjects(sample);
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe("published-sample");
  });

  it("orders and filters Indonesian boot greetings accurately", () => {
    const customGreetings: BootGreeting[] = [
      {
        id: "g-2",
        language: "Sundanese",
        greeting: "Wilujeng Sumping",
        meaning: "Welcome",
        isEnabled: true,
        displayOrder: 2,
        status: "published",
      },
      {
        id: "g-disabled",
        language: "Hidden",
        greeting: "Hidden",
        meaning: "Hidden",
        isEnabled: false,
        displayOrder: 0,
        status: "published",
      },
      {
        id: "g-draft",
        language: "DraftLang",
        greeting: "Draft",
        meaning: "Draft",
        isEnabled: true,
        displayOrder: 0,
        status: "draft",
      },
      {
        id: "g-1",
        language: "Indonesian",
        greeting: "Selamat Datang",
        meaning: "Welcome",
        isEnabled: true,
        displayOrder: 1,
        status: "published",
      },
    ];

    const sorted = filterAndSortPublicGreetings(customGreetings);
    expect(sorted.map((g) => g.id)).toEqual(["g-1", "g-2"]);
    expect(INITIAL_BOOT_GREETINGS).toHaveLength(10);
  });

  it("never silently falls back from production Supabase mode to fixture mode when credentials are missing", async () => {
    const repo = getPortfolioRepository("supabase");
    expect(repo).toBeInstanceOf(SupabasePortfolioRepository);

    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      await expect(repo.getPublicPortfolioBundle()).rejects.toThrow(
        /NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured/,
      );
    } finally {
      if (prevUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
      if (prevKey !== undefined) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevKey;
    }
  });

  it("formats month/year period ranges cleanly", () => {
    expect(formatMonthYear(3, 2025)).toBe("Mar 2025");
    expect(
      formatPeriodRange({
        startMonth: 1,
        startYear: 2024,
        endMonth: null,
        endYear: null,
        isCurrent: true,
      }),
    ).toBe("Jan 2024 — Present");
  });
});
