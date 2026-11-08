import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { HomeShowcaseSection } from "@/components/public/home-sections";
import { HomeFullScreenDeck } from "@/components/public/home-fullscreen-deck";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { projectDraftSchema } from "@/lib/validations/cms";
import { INITIAL_PROJECTS } from "@/lib/database/fixtures";
import type { ProjectSummary } from "@/types/portfolio";

const mockPublishedProject: ProjectSummary = {
  id: "proj-geo-published",
  slug: "geoentity-live",
  name: "GeoEntity Cloud",
  version: "v1.2.0",
  description: "Geospatial data engine with optimized indexing.",
  descriptionId: "Mesin data geospasial dengan pengindeksan optimal.",
  technologies: ["Go", "PostgreSQL", "Docker"],
  categorizedTechnologies: [
    { category: "BE", name: "Go" },
    { category: "DB", name: "PostgreSQL" },
    { category: "DEVOPS & INFRA", name: "Docker" },
  ],
  coverUrl: "https://example.com/assets/geoentity-preview.png",
  githubUrl: "https://github.com/uzaannnnnn/geoentity-cloud",
  liveDemoUrl: "https://geoentity.example.com",
  projectCompletionState: "Production",
  status: "published",
  isFeatured: true,
  displayOrder: 1,
  updatedAt: "2026-11-06T00:00:00Z",
};

const mockGitLabProject: ProjectSummary = {
  id: "proj-gitlab",
  slug: "gitlab-service",
  name: "Internal Service",
  description: "Private enterprise service deployed on custom cloud.",
  descriptionId: "Layanan perusahaan internal pada cloud mandiri.",
  category: "Systems",
  categoryId: "Sistem",
  technologies: ["Rust", "gRPC"],
  coverUrl: "https://example.com/assets/service-preview.png",
  githubUrl: "https://gitlab.com/company/internal-service",
  liveDemoUrl: "https://service.internal.io",
  projectCompletionState: "Production",
  status: "published",
  isFeatured: false,
  displayOrder: 2,
  updatedAt: "2026-11-06T00:00:00Z",
};

const mockNoLinksProject: ProjectSummary = {
  id: "proj-nolinks",
  slug: "offline-system",
  name: "Offline Research System",
  description: "Proprietary research system without public repositories or deployment.",
  descriptionId: "Sistem riset privat tanpa repositori publik atau penempatan langsung.",
  category: "Research",
  categoryId: "Riset",
  technologies: ["C++"],
  coverUrl: "https://example.com/assets/research.png",
  githubUrl: null,
  liveDemoUrl: null,
  projectCompletionState: "Research",
  status: "published",
  isFeatured: false,
  displayOrder: 3,
  updatedAt: "2026-11-06T00:00:00Z",
};

describe("Showcase — 16:9 Aspect Ratio, Compact Layout, Action Links & Theme Adaptation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders cover images directly inside project card without extra container using object-contain preserving natural aspect ratio", () => {
    render(<HomeShowcaseSection projects={[mockPublishedProject]} />);

    const container = screen.queryByTestId("project-image-container-geoentity-live");
    expect(container).not.toBeInTheDocument();

    const img = screen.getByTestId("project-image-geoentity-live");
    expect(img).toBeInTheDocument();
    expect(img).toHaveClass("w-full");
    expect(img).toHaveClass("h-auto");
    expect(img).toHaveClass("object-contain");
    expect(img).toHaveClass("rounded-lg");
    expect(img).toHaveAttribute("src", "https://example.com/assets/geoentity-preview.png");
  });

  it("orders technologies strictly by CMS category sequence FE -> BE -> DB -> API -> ARCHITECTURE -> DEVOPS & INFRA -> SOFTWARE QUALITY and displays all items without truncation", () => {
    const projectWithMultiCategoryTechs: ProjectSummary = {
      ...mockPublishedProject,
      slug: "full-stack-system",
      categorizedTechnologies: [
        { category: "SOFTWARE QUALITY", name: "Playwright" },
        { category: "DB", name: "PostgreSQL" },
        { category: "FE", name: "Next.js" },
        { category: "DEVOPS & INFRA", name: "Docker" },
        { category: "FE", name: "Tailwind CSS" },
        { category: "ARCHITECTURE", name: "Event-Driven" },
        { category: "API", name: "GraphQL" },
        { category: "BE", name: "Go" },
        { category: "DEVOPS & INFRA", name: "AWS ECS" },
        { category: "SOFTWARE QUALITY", name: "Vitest" },
      ],
    };

    render(<HomeShowcaseSection projects={[projectWithMultiCategoryTechs]} />);

    // All 10 technologies should be rendered (no .slice(0, 6) limit!)
    const techContainer = screen.getByTestId("home-showcase-technologies-full-stack-system");
    expect(techContainer).toBeInTheDocument();

    // Verify exact sequence:
    // FE: Next.js, Tailwind CSS
    // BE: Go
    // DB: PostgreSQL
    // API: GraphQL
    // ARCHITECTURE: Event-Driven
    // DEVOPS & INFRA: Docker, AWS ECS
    // SOFTWARE QUALITY: Playwright, Vitest
    const expectedOrder = [
      "Next.js",
      "Tailwind CSS",
      "Go",
      "PostgreSQL",
      "GraphQL",
      "Event-Driven",
      "Docker",
      "AWS ECS",
      "Playwright",
      "Vitest",
    ];

    expectedOrder.forEach((name, index) => {
      const pill = screen.getByTestId(`tech-pill-full-stack-system-${index}`);
      expect(pill).toHaveTextContent(name);
    });
  });

  it("renders English action links with accessible aria-labels, tooltips, and no visible text", () => {
    render(
      <ThemeProvider defaultLanguage="en">
        <HomeShowcaseSection projects={[mockPublishedProject]} />
      </ThemeProvider>,
    );

    const liveDemoLink = screen.getByTestId("home-showcase-live-demo-geoentity-live");
    expect(liveDemoLink).toBeInTheDocument();
    expect(liveDemoLink).toHaveAttribute("href", "https://geoentity.example.com");
    expect(liveDemoLink).toHaveAttribute("target", "_blank");
    expect(liveDemoLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(liveDemoLink).toHaveAttribute("aria-label", "Live Demo");
    expect(liveDemoLink).toHaveTextContent(""); // No visible text label

    const sourceCodeLink = screen.getByTestId("home-showcase-source-code-geoentity-live");
    expect(sourceCodeLink).toBeInTheDocument();
    expect(sourceCodeLink).toHaveAttribute(
      "href",
      "https://github.com/uzaannnnnn/geoentity-cloud",
    );
    expect(sourceCodeLink).toHaveAttribute("target", "_blank");
    expect(sourceCodeLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(sourceCodeLink).toHaveAttribute("aria-label", "Source Code");
    expect(sourceCodeLink).toHaveTextContent(""); // No visible text label

    // Matching tooltips exist
    const liveDemoTooltip = screen.getByTestId(
      "home-showcase-live-demo-geoentity-live-tooltip",
    );
    expect(liveDemoTooltip).toHaveTextContent("Live Demo");

    const sourceCodeTooltip = screen.getByTestId(
      "home-showcase-source-code-geoentity-live-tooltip",
    );
    expect(sourceCodeTooltip).toHaveTextContent("Source Code");
  });

  it("renders Indonesian action links with accessible aria-labels and tooltips when language is ID", () => {
    localStorage.setItem("portfolio_language", "id");
    render(
      <ThemeProvider defaultLanguage="id">
        <HomeShowcaseSection projects={[mockPublishedProject]} />
      </ThemeProvider>,
    );

    const liveDemoLink = screen.getByTestId("home-showcase-live-demo-geoentity-live");
    expect(liveDemoLink).toHaveAttribute("aria-label", "Demo Langsung");
    expect(liveDemoLink).toHaveTextContent("");

    const sourceCodeLink = screen.getByTestId("home-showcase-source-code-geoentity-live");
    expect(sourceCodeLink).toHaveAttribute("aria-label", "Kode Sumber");
    expect(sourceCodeLink).toHaveTextContent("");

    expect(
      screen.getByTestId("home-showcase-live-demo-geoentity-live-tooltip"),
    ).toHaveTextContent("Demo Langsung");
    expect(
      screen.getByTestId("home-showcase-source-code-geoentity-live-tooltip"),
    ).toHaveTextContent("Kode Sumber");
  });

  it("shows tooltips on hover and keyboard focus with subtle hover/focus states", () => {
    render(<HomeShowcaseSection projects={[mockPublishedProject]} />);

    const liveDemoLink = screen.getByTestId("home-showcase-live-demo-geoentity-live");
    const liveDemoTooltip = screen.getByTestId(
      "home-showcase-live-demo-geoentity-live-tooltip",
    );

    expect(liveDemoTooltip).toHaveAttribute("data-visible", "false");

    // Hover reveals tooltip
    fireEvent.mouseEnter(liveDemoLink);
    expect(liveDemoTooltip).toHaveAttribute("data-visible", "true");

    // Mouse leave hides tooltip
    fireEvent.mouseLeave(liveDemoLink);
    expect(liveDemoTooltip).toHaveAttribute("data-visible", "false");

    // Keyboard focus reveals tooltip
    fireEvent.focus(liveDemoLink);
    expect(liveDemoTooltip).toHaveAttribute("data-visible", "true");

    // Blur hides tooltip
    fireEvent.blur(liveDemoLink);
    expect(liveDemoTooltip).toHaveAttribute("data-visible", "false");
  });

  it("uses the exact same theme-aware foreground color tokens and sizing on both action icons", () => {
    render(<HomeShowcaseSection projects={[mockPublishedProject]} />);

    const sourceCodeLink = screen.getByTestId("home-showcase-source-code-geoentity-live");
    const liveDemoLink = screen.getByTestId("home-showcase-live-demo-geoentity-live");

    expect(sourceCodeLink).toHaveClass("text-foreground/75");
    expect(liveDemoLink).toHaveClass("text-foreground/75");
    expect(sourceCodeLink).toHaveClass("hover:text-foreground");
    expect(liveDemoLink).toHaveClass("hover:text-foreground");

    const sourceSvg = sourceCodeLink.querySelector("svg");
    const liveSvg = liveDemoLink.querySelector("svg");

    expect(sourceSvg).toHaveClass("h-4");
    expect(sourceSvg).toHaveClass("w-4");
    expect(liveSvg).toHaveClass("h-4");
    expect(liveSvg).toHaveClass("w-4");

    // Neither icon uses text-accent
    expect(sourceSvg).not.toHaveClass("text-accent");
    expect(liveSvg).not.toHaveClass("text-accent");
  });

  it("omits action links row when neither liveDemoUrl nor githubUrl is provided", () => {
    render(<HomeShowcaseSection projects={[mockNoLinksProject]} />);

    expect(
      screen.queryByTestId("home-showcase-actions-offline-system"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("home-showcase-live-demo-offline-system"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("home-showcase-source-code-offline-system"),
    ).not.toBeInTheDocument();
  });

  it("supports non-GitHub repositories (e.g. GitLab) with generic code icon", () => {
    render(<HomeShowcaseSection projects={[mockGitLabProject]} />);

    const sourceCodeLink = screen.getByTestId("home-showcase-source-code-gitlab-service");
    expect(sourceCodeLink).toHaveAttribute(
      "href",
      "https://gitlab.com/company/internal-service",
    );
    expect(sourceCodeLink).toHaveAttribute("aria-label", "Source Code");
    expect(sourceCodeLink).toHaveTextContent("");
  });

  it("applies theme-aware styling to technology pills with accessible contrast", () => {
    render(<HomeShowcaseSection projects={[mockPublishedProject]} />);

    const techPill = screen.getByTestId("tech-pill-geoentity-live-0");
    expect(techPill).toHaveClass("bg-surface/60");
    expect(techPill).toHaveClass("text-secondary-foreground");
    expect(techPill).toHaveClass("border-border-token");
  });

  it("renders project version directly beside the name on the same baseline with compact typography", () => {
    render(<HomeShowcaseSection projects={[mockPublishedProject]} />);

    const versionElement = screen.getByTestId("project-version-geoentity-live");
    expect(versionElement).toBeInTheDocument();
    expect(versionElement).toHaveTextContent("v1.2.0");
    expect(versionElement).toHaveClass("font-mono");
    expect(versionElement).toHaveClass("text-xs");

    const titleElement = screen.getByText("GeoEntity Cloud");
    expect(titleElement).toBeInTheDocument();
    const parentContainer = titleElement.parentElement;
    expect(parentContainer).toHaveClass("flex");
    expect(parentContainer).toHaveClass("items-baseline");
  });

  it("renders categorized technologies as inline elements with category icons and technology names", () => {
    render(<HomeShowcaseSection projects={[mockPublishedProject]} />);

    const pill0 = screen.getByTestId("tech-pill-geoentity-live-0");
    expect(pill0).toHaveTextContent("Go");
    expect(pill0.querySelector("svg")).toBeInTheDocument();

    const pill1 = screen.getByTestId("tech-pill-geoentity-live-1");
    expect(pill1).toHaveTextContent("PostgreSQL");
    expect(pill1.querySelector("svg")).toBeInTheDocument();

    const pill2 = screen.getByTestId("tech-pill-geoentity-live-2");
    expect(pill2).toHaveTextContent("Docker");
    expect(pill2.querySelector("svg")).toBeInTheDocument();
  });

  it("places actions on the right side in exact order: Source Code -> Live Demo (Live Demo rightmost)", () => {
    render(<HomeShowcaseSection projects={[mockPublishedProject]} />);

    const actionsContainer = screen.getByTestId("home-showcase-actions-geoentity-live");
    expect(actionsContainer).toHaveClass("justify-end");

    const links = actionsContainer.querySelectorAll("a");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("data-testid", "home-showcase-source-code-geoentity-live");
    expect(links[1]).toHaveAttribute("data-testid", "home-showcase-live-demo-geoentity-live");
  });

  it("does not render Category on the showcase card", () => {
    render(<HomeShowcaseSection projects={[mockPublishedProject]} />);
    expect(screen.queryByText("Data Engineering")).not.toBeInTheDocument();
    expect(screen.queryByText("Rekayasa Data")).not.toBeInTheDocument();
  });

  it("validates independent Repository URL and Live Demo URL in CMS projectDraftSchema with required Version", () => {
    const validDraft = {
      id: "proj-1",
      slug: "test-slug",
      name: "Test Project",
      version: "v1.0.0",
      description: "Valid project description with more than ten characters.",
      technologies: ["TypeScript"],
      categorizedTechnologies: [
        { category: "ARCHITECTURE" as const, name: "TypeScript" },
      ],
      coverUrl: "https://example.com/cover.png",
      githubUrl: "https://github.com/example/repo",
      liveDemoUrl: "https://example-demo.vercel.app",
      projectCompletionState: "Production",
      status: "draft" as const,
      isFeatured: false,
      displayOrder: 1,
      updatedAt: "2026-11-06T00:00:00Z",
      screenshots: [],
      caseStudySections: [],
    };

    // Valid URLs pass
    const parsed = projectDraftSchema.parse(validDraft);
    expect(parsed.githubUrl).toBe("https://github.com/example/repo");
    expect(parsed.liveDemoUrl).toBe("https://example-demo.vercel.app");
    expect(parsed.version).toBe("v1.0.0");

    // Empty strings normalize to null
    const emptyUrls = {
      ...validDraft,
      githubUrl: "",
      liveDemoUrl: "",
      coverUrl: "",
    };
    const parsedEmpty = projectDraftSchema.parse(emptyUrls);
    expect(parsedEmpty.githubUrl).toBeNull();
    expect(parsedEmpty.liveDemoUrl).toBeNull();
    expect(parsedEmpty.coverUrl).toBeNull();

    // Invalid URLs throw validation error
    const invalidUrlDraft = {
      ...validDraft,
      githubUrl: "invalid-url-string",
    };
    expect(() => projectDraftSchema.parse(invalidUrlDraft)).toThrow();

    // Missing version throws validation error
    const noVersionDraft = {
      ...validDraft,
      version: "",
    };
    expect(() => projectDraftSchema.parse(noVersionDraft)).toThrow();
  });

  it("renders all published projects without arbitrary 2-project truncation", () => {
    const threeProjects: ProjectSummary[] = [
      mockPublishedProject,
      mockGitLabProject,
      {
        ...mockPublishedProject,
        id: "proj-3",
        slug: "third-system",
        name: "Third Project",
        status: "published",
        displayOrder: 3,
      },
    ];

    render(<HomeShowcaseSection projects={threeProjects} />);

    expect(screen.getByTestId("home-showcase-item-geoentity-live")).toBeInTheDocument();
    expect(screen.getByTestId("home-showcase-item-gitlab-service")).toBeInTheDocument();
    expect(screen.getByTestId("home-showcase-item-third-system")).toBeInTheDocument();
  });

  it("preserves publication safeguards: GeoEntity, ClayCV, and SPK Bansos SAW remain draft", () => {
    for (const project of INITIAL_PROJECTS) {
      expect(project.status).toBe("draft");
    }

    render(<HomeShowcaseSection projects={INITIAL_PROJECTS} />);
    expect(screen.queryByText("GeoEntity")).not.toBeInTheDocument();
    expect(screen.queryByText("ClayCV")).not.toBeInTheDocument();
    expect(screen.queryByText("SPK Bansos SAW")).not.toBeInTheDocument();
    expect(screen.getByTestId("home-showcase-empty")).toBeInTheDocument();
  });

  describe("Showcase 3-Project Horizontal Carousel with Separate Pill Indicators", () => {
    it("renders fixed 3-project pages and separate oval indicators for 1, 2, 3, 4, 6, 7, 9, and 10 published projects", () => {
      const counts = [1, 2, 3, 4, 6, 7, 9, 10];
      for (const count of counts) {
        const testProjects: ProjectSummary[] = Array.from({ length: count }, (_, i) => ({
          ...mockPublishedProject,
          id: `proj-${count}-${i + 1}`,
          slug: `project-${count}-${i + 1}`,
          name: `Project ${count}-${i + 1}`,
          status: "published",
          displayOrder: i + 1,
        }));

        const { unmount } = render(<HomeShowcaseSection projects={testProjects} />);

        const expectedPages = Math.ceil(count / 3);
        const indicators = screen.getAllByRole("tab");
        expect(indicators).toHaveLength(expectedPages);

        // Every indicator is a separate oval button
        indicators.forEach((indicator, idx) => {
          expect(indicator).toHaveAttribute("data-testid", `showcase-page-indicator-${idx}`);
          expect(indicator).toHaveClass("rounded-full");
          expect(indicator).toHaveClass("w-6");
        });

        // First indicator is active by default
        expect(indicators[0]).toHaveAttribute("data-active", "true");
        expect(indicators[0]).toHaveClass("bg-foreground");

        // Verify page grouping: each page has max 3 projects
        for (let pageIdx = 0; pageIdx < expectedPages; pageIdx++) {
          const pageEl = screen.getByTestId(`showcase-page-${pageIdx}`);
          expect(pageEl).toBeInTheDocument();
          expect(pageEl).toHaveClass("justify-center"); // Center incomplete final page and balanced pages

          const expectedInPage =
            pageIdx === expectedPages - 1 && count % 3 !== 0 ? count % 3 : 3;
          expect(pageEl.children).toHaveLength(expectedInPage);
        }

        unmount();
      }
    });

    it("centers incomplete final page with 1 or 2 projects while preserving card widths", () => {
      // 4 projects: Page 0 has 3 projects, Page 1 has 1 project
      const fourProjects: ProjectSummary[] = Array.from({ length: 4 }, (_, i) => ({
        ...mockPublishedProject,
        id: `proj-4-${i + 1}`,
        slug: `project-4-${i + 1}`,
        name: `Project 4-${i + 1}`,
        status: "published",
        displayOrder: i + 1,
      }));

      render(<HomeShowcaseSection projects={fourProjects} />);

      const page0 = screen.getByTestId("showcase-page-0");
      const page1 = screen.getByTestId("showcase-page-1");

      expect(page0).toHaveClass("justify-center");
      expect(page1).toHaveClass("justify-center");
      expect(page1.children).toHaveLength(1);

      // Single card in final page retains the consistent showcase-card class
      const singleCard = screen.getByTestId("home-showcase-item-project-4-4");
      expect(singleCard).toHaveClass("showcase-card");
    });

    it("clicking separate oval indicator navigates directly to that project page", () => {
      const tenProjects: ProjectSummary[] = Array.from({ length: 10 }, (_, i) => ({
        ...mockPublishedProject,
        id: `proj-10-${i + 1}`,
        slug: `project-10-${i + 1}`,
        name: `Project 10-${i + 1}`,
        status: "published",
        displayOrder: i + 1,
      }));

      render(<HomeShowcaseSection projects={tenProjects} />);

      const indicators = screen.getAllByRole("tab");
      expect(indicators).toHaveLength(4);

      // Click page 3 indicator (Page 4: 0-indexed index 3)
      fireEvent.click(indicators[3]!);

      // Active state updates to indicator 3
      expect(indicators[3]).toHaveAttribute("data-active", "true");
      expect(indicators[3]).toHaveClass("bg-foreground");
      expect(indicators[0]).toHaveAttribute("data-active", "false");

      // Track translates to -300%
      const track = screen.getByTestId("home-showcase-carousel-track");
      expect(track).toHaveStyle({
        transform: "translate3d(calc(-300% + 0px), 0, 0)",
      });

      // Click page 1 indicator (index 1)
      fireEvent.click(indicators[1]!);
      expect(indicators[1]).toHaveAttribute("data-active", "true");
      expect(track).toHaveStyle({
        transform: "translate3d(calc(-100% + 0px), 0, 0)",
      });
    });

    it("supports horizontal trackpad wheel and Shift+wheel to advance/reverse exactly one page", () => {
      const sixProjects: ProjectSummary[] = Array.from({ length: 6 }, (_, i) => ({
        ...mockPublishedProject,
        id: `proj-6-${i + 1}`,
        slug: `project-6-${i + 1}`,
        name: `Project 6-${i + 1}`,
        status: "published",
        displayOrder: i + 1,
      }));

      render(<HomeShowcaseSection projects={sixProjects} />);

      const viewport = screen.getByTestId("home-showcase-carousel-viewport");
      const track = screen.getByTestId("home-showcase-carousel-track");
      const indicators = screen.getAllByRole("tab");

      expect(indicators[0]).toHaveAttribute("data-active", "true");

      // 1. Horizontal trackpad wheel (deltaX = 50, deltaY = 0) advances to Page 1
      fireEvent.wheel(viewport, {
        deltaX: 50,
        deltaY: 0,
        shiftKey: false,
      });

      expect(indicators[1]).toHaveAttribute("data-active", "true");
      expect(track).toHaveStyle({
        transform: "translate3d(calc(-100% + 0px), 0, 0)",
      });

      // 2. Shift + wheel (shiftKey = true, deltaY = -50) returns to Page 0
      fireEvent.wheel(viewport, {
        deltaX: 0,
        deltaY: -50,
        shiftKey: true,
      });

      expect(indicators[0]).toHaveAttribute("data-active", "true");
      expect(track).toHaveStyle({
        transform: "translate3d(calc(-0% + 0px), 0, 0)",
      });
    });

    it("supports mouse drag and touch swipe navigation while protecting link clicks", () => {
      const sixProjects: ProjectSummary[] = Array.from({ length: 6 }, (_, i) => ({
        ...mockPublishedProject,
        id: `proj-6-${i + 1}`,
        slug: `project-6-${i + 1}`,
        name: `Project 6-${i + 1}`,
        status: "published",
        displayOrder: i + 1,
      }));

      render(<HomeShowcaseSection projects={sixProjects} />);

      const viewport = screen.getByTestId("home-showcase-carousel-viewport");
      const indicators = screen.getAllByRole("tab");
      const liveDemoLink = screen.getByTestId("home-showcase-live-demo-project-6-1");

      // 1. Mouse Drag forward: mousedown -> mousemove -80px -> mouseup advances to Page 1
      fireEvent.mouseDown(viewport, { button: 0, clientX: 200 });
      fireEvent.mouseMove(viewport, { clientX: 100 }); // -100px drag
      fireEvent.mouseUp(viewport, { clientX: 100 });

      expect(indicators[1]).toHaveAttribute("data-active", "true");

      // 2. Touch swipe backward: touchstart -> touchmove +80px -> touchend returns to Page 0
      fireEvent.touchStart(viewport, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(viewport, {
        touches: [{ clientX: 180, clientY: 100 }],
      });
      fireEvent.touchEnd(viewport, {
        changedTouches: [{ clientX: 180, clientY: 100 }],
      });

      expect(indicators[0]).toHaveAttribute("data-active", "true");

      // 3. Normal click on link without drag works cleanly
      let clickPrevented = false;
      liveDemoLink.addEventListener("click", (e) => {
        clickPrevented = e.defaultPrevented;
      });
      fireEvent.click(liveDemoLink);
      expect(clickPrevented).toBe(false);
    });

    it("HomeFullScreenDeck ignores dominant horizontal trackpad gestures and Shift+wheel without triggering vertical transitions", () => {
      render(
        <HomeFullScreenDeck>
          <div id="hero" data-testid="slide-hero">Hero</div>
          <div id="showcase" data-testid="slide-showcase">Showcase</div>
        </HomeFullScreenDeck>,
      );

      const deck = screen.getByTestId("home-continuous-flow");
      expect(deck).toHaveAttribute("data-active-section", "0");

      // Horizontal trackpad gesture (deltaX = 80, deltaY = 10)
      fireEvent.wheel(window, {
        deltaX: 80,
        deltaY: 10,
        deltaMode: 0,
      });

      // Still at section 0!
      expect(deck).toHaveAttribute("data-active-section", "0");

      // Shift + wheel (shiftKey = true, deltaY = 100)
      fireEvent.wheel(window, {
        shiftKey: true,
        deltaX: 0,
        deltaY: 100,
        deltaMode: 0,
      });

      // Still at section 0!
      expect(deck).toHaveAttribute("data-active-section", "0");

      // Vertical wheel (deltaY = 120, deltaX = 0)
      fireEvent.wheel(window, {
        deltaX: 0,
        deltaY: 120,
        deltaMode: 0,
      });

      // Navigated to section 1!
      expect(deck).toHaveAttribute("data-active-section", "1");
    });

    it("HomeFullScreenDeck consumes horizontal touch swipe so it never triggers vertical section transitions", () => {
      render(
        <HomeFullScreenDeck>
          <div id="hero" data-testid="slide-hero">Hero</div>
          <div id="showcase" data-testid="slide-showcase">Showcase</div>
        </HomeFullScreenDeck>,
      );

      const deck = screen.getByTestId("home-continuous-flow");
      expect(deck).toHaveAttribute("data-active-section", "0");

      // Horizontal swipe: start at (100, 100), move to (30, 105), end
      fireEvent.touchStart(deck, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(deck, {
        touches: [{ clientX: 30, clientY: 105 }],
      });
      fireEvent.touchEnd(deck, {
        changedTouches: [{ clientX: 30, clientY: 105 }],
      });

      // Still at section 0!
      expect(deck).toHaveAttribute("data-active-section", "0");

      // Vertical swipe: start at (100, 200), move to (105, 100), end
      fireEvent.touchStart(deck, {
        touches: [{ clientX: 100, clientY: 200 }],
      });
      fireEvent.touchMove(deck, {
        touches: [{ clientX: 105, clientY: 100 }],
      });
      fireEvent.touchEnd(deck, {
        changedTouches: [{ clientX: 105, clientY: 100 }],
      });

      // Navigated to section 1!
      expect(deck).toHaveAttribute("data-active-section", "1");
    });
  });
});
