import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { CaseStudyView } from "@/components/case-study/case-study-view";
import { ProjectDirectory } from "@/components/public/project-directory";
import { SafeMdxRenderer } from "@/components/public/safe-mdx-renderer";
import { buildPublicSitemap } from "@/app/sitemap";
import robots from "@/app/robots";
import { buildPortfolioStructuredData } from "@/lib/seo/structured-data";
import { FixturePortfolioRepository } from "@/lib/database/repository";
import { INITIAL_PROFILE, INITIAL_SITE_SETTINGS, INITIAL_PROJECTS } from "@/lib/database/fixtures";
import {
  CASE_STUDY_SECTION_LABELS,
  type CaseStudySectionType,
  type ProjectDetail,
} from "@/types/portfolio";

const ALL_14_SECTION_TYPES: CaseStudySectionType[] = [
  "overview",
  "problem",
  "objectives",
  "solution",
  "architecture",
  "implementation",
  "database",
  "api",
  "challenges",
  "tradeoffs",
  "testing",
  "deployment",
  "results",
  "lessons",
];

function createTestOnlyPublishedProject(): ProjectDetail {
  return {
    id: "test-only-published-project",
    slug: "test-only-architecture-showcase",
    name: "Test-Only Systems Engineering Case Study",
    description:
      "Isolated test fixture verifying all 14 configurable case study sections and system architecture diagram rendering.",
    category: "Systems Engineering",
    technologies: ["Go", "PostgreSQL", "TypeScript", "Next.js"],
    coverUrl: null,
    githubUrl: "https://github.com/uzaannnnnn/GeoEntity",
    liveDemoUrl: null,
    projectCompletionState: "Test-Only Fixture",
    status: "published",
    isFeatured: true,
    displayOrder: 1,
    updatedAt: "2026-11-06T00:00:00.000Z",
    screenshots: [],
    architectureDiagram: {
      title: "Multi-Layer Service Topology",
      summary: "End-to-end request flow from client boundary to relational storage.",
      nodes: [
        {
          id: "node-client",
          label: "Web Client Interface",
          layer: "client",
          description: "Server-rendered views and typed form submissions.",
          technologies: ["Next.js", "TypeScript"],
        },
        {
          id: "node-db",
          label: "Relational Store",
          layer: "data",
          description: "Normalized tables with strict row-level security.",
          technologies: ["PostgreSQL"],
        },
      ],
      connections: [
        {
          id: "conn-1",
          from: "node-client",
          to: "node-db",
          protocolOrAction: "Parameterized SQL via Server Repository",
        },
      ],
    },
    caseStudySections: ALL_14_SECTION_TYPES.map((type, idx) => ({
      id: `sec-${type}`,
      sectionType: type,
      title: CASE_STUDY_SECTION_LABELS[type],
      content: `Verified test content for section **${CASE_STUDY_SECTION_LABELS[type]}** (${idx + 1}/14).`,
      displayOrder: idx + 1,
      isEnabled: true,
    })),
  };
}

describe("Sprint 2 — 14-Section Case Study, Architecture Diagram, Filtering & SEO", () => {
  it("renders all 14 case study sections and the embedded architecture diagram using isolated test-only fixtures", () => {
    const testProject = createTestOnlyPublishedProject();
    render(<CaseStudyView project={testProject} relatedProjects={[]} />);

    expect(
      screen.getByRole("heading", {
        name: "Test-Only Systems Engineering Case Study",
      }),
    ).toBeInTheDocument();

    // Verify all 14 sections render in order
    for (const sectionType of ALL_14_SECTION_TYPES) {
      const sectionEl = screen.getByTestId(`case-study-section-${sectionType}`);
      expect(sectionEl).toBeInTheDocument();
    }

    // Verify architecture diagram nodes and connections render
    expect(screen.getByTestId("architecture-diagram-view")).toBeInTheDocument();
    expect(screen.getByTestId("arch-node-node-client")).toHaveTextContent(
      "Web Client Interface",
    );
    expect(screen.getByTestId("arch-connection-conn-1")).toHaveTextContent(
      "Parameterized SQL via Server Repository",
    );
  });

  it("omits disabled or empty case study sections cleanly without forcing every section to be populated", () => {
    const partialProject = createTestOnlyPublishedProject();
    partialProject.caseStudySections = partialProject.caseStudySections.map(
      (sec) =>
        sec.sectionType === "overview" || sec.sectionType === "architecture"
          ? sec
          : { ...sec, isEnabled: false },
    );

    render(<CaseStudyView project={partialProject} />);
    expect(screen.getByTestId("case-study-section-overview")).toBeInTheDocument();
    expect(
      screen.getByTestId("case-study-section-architecture"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("case-study-section-problem"),
    ).not.toBeInTheDocument();
  });

  it("filters published projects by search query, category, and technology in ProjectDirectory", () => {
    const p1 = createTestOnlyPublishedProject();
    const p2: ProjectDetail = {
      ...createTestOnlyPublishedProject(),
      id: "test-only-2",
      slug: "test-only-frontend",
      name: "Frontend Design System",
      category: "Frontend Engineering",
      technologies: ["React", "Tailwind CSS"],
    };

    render(<ProjectDirectory projects={[p1, p2]} />);
    expect(
      screen.getByTestId("project-card-test-only-architecture-showcase"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("project-card-test-only-frontend"),
    ).toBeInTheDocument();

    // Filter by category
    fireEvent.change(screen.getByTestId("project-category-select"), {
      target: { value: "Frontend Engineering" },
    });
    expect(
      screen.queryByTestId("project-card-test-only-architecture-showcase"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("project-card-test-only-frontend"),
    ).toBeInTheDocument();

    // Reset filters
    fireEvent.click(screen.getByTestId("project-reset-filters"));
    expect(
      screen.getByTestId("project-card-test-only-architecture-showcase"),
    ).toBeInTheDocument();
  });

  it("renders SafeMdxRenderer without executing raw HTML or script tags", () => {
    const maliciousContent = `## Architecture Overview\n\nParagraph with **bold** and \`inline_code\`.\n\n<script>window.__xss = true;</script>\n\n\`\`\`sql\nSELECT 1;\n\`\`\``;
    const { container } = render(<SafeMdxRenderer content={maliciousContent} />);

    expect(
      screen.getByRole("heading", { name: "Architecture Overview" }),
    ).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("SELECT 1;")).toBeInTheDocument();
  });

  it("excludes all draft projects (GeoEntity, ClayCV, SPK Bansos SAW) from sitemap.ts while including published notes", async () => {
    const defaultRepo = new FixturePortfolioRepository();
    const entries = await buildPublicSitemap(defaultRepo);
    const urls = entries.map((e) => e.url);

    // Static routes + published note are included
    expect(urls).toContain("http://localhost:3000/");
    expect(urls).toContain("http://localhost:3000/projects");
    expect(urls).toContain(
      "http://localhost:3000/notes/explicit-draft-to-publish-content-workflows",
    );

    // Draft projects are strictly excluded from sitemap
    for (const draftProject of INITIAL_PROJECTS) {
      expect(urls).not.toContain(
        `http://localhost:3000/projects/${draftProject.slug}`,
      );
    }
  });

  it("generates accurate robots.ts and JSON-LD structured data without fabricated claims", () => {
    const robotsConfig = robots();
    expect(robotsConfig.sitemap).toBe("http://localhost:3000/sitemap.xml");

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
