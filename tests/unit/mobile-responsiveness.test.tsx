import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme/theme-provider";
import {
  ActiveSectionProvider,
  useActiveSection,
  type PublicSectionId,
} from "@/components/public/active-section-context";
import { FloatingControlsWrapper } from "@/components/theme/floating-controls-wrapper";
import { HomeFullScreenDeck } from "@/components/public/home-fullscreen-deck";
import { HomeShowcaseSection } from "@/components/public/home-sections";
import type { ProjectSummary } from "@/types/portfolio";

function TestSectionSwitcher() {
  const { activeSectionId, setActiveSectionId, isFloatingControlVisible } =
    useActiveSection();

  return (
    <div>
      <span data-testid="current-active-section">{activeSectionId}</span>
      <span data-testid="floating-visible">
        {isFloatingControlVisible ? "visible" : "hidden"}
      </span>
      {(
        [
          "hero",
          "me",
          "experience",
          "showcase",
          "certifications",
          "contact",
        ] as PublicSectionId[]
      ).map((id) => (
        <button
          key={id}
          data-testid={`switch-to-${id}`}
          onClick={() => setActiveSectionId(id)}
        >
          {id}
        </button>
      ))}
    </div>
  );
}

const mockProjects: ProjectSummary[] = [
  {
    id: "proj-1",
    slug: "claycv",
    name: "ClayCV",
    version: "v1.0",
    description: "Resume builder",
    descriptionId: "Pembuat resume",
    technologies: ["Next.js", "Node.js"],
    status: "published",
    isFeatured: true,
    displayOrder: 1,
    projectCompletionState: "Complete",
    coverUrl: "https://example.com/claycv.png",
    githubUrl: "https://github.com/example/claycv",
    liveDemoUrl: "https://claycv.example.com",
    categorizedTechnologies: [
      { category: "FE", name: "Next.js" },
      { category: "BE", name: "Node.js" },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj-2",
    slug: "devflow",
    name: "DevFlow",
    version: "v1.0",
    description: "Dev management tool",
    descriptionId: "Alat manajemen dev",
    technologies: ["React", "PostgreSQL"],
    status: "published",
    isFeatured: false,
    displayOrder: 2,
    projectCompletionState: "Complete",
    coverUrl: "https://example.com/devflow.png",
    githubUrl: "https://github.com/example/devflow",
    liveDemoUrl: "https://devflow.example.com",
    categorizedTechnologies: [
      { category: "FE", name: "React" },
      { category: "DB", name: "PostgreSQL" },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj-3",
    slug: "erp",
    name: "Manufacturing ERP",
    version: "v1.0",
    description: "ERP system",
    descriptionId: "Sistem ERP",
    technologies: ["REST API"],
    status: "published",
    isFeatured: false,
    displayOrder: 3,
    projectCompletionState: "Complete",
    coverUrl: "https://example.com/erp.png",
    githubUrl: "https://github.com/example/erp",
    liveDemoUrl: "https://erp.example.com",
    categorizedTechnologies: [{ category: "API", name: "REST API" }],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj-4",
    slug: "newsora",
    name: "Newsora",
    version: "v1.0",
    description: "News aggregator",
    descriptionId: "Agregator berita",
    technologies: ["Microservices"],
    status: "published",
    isFeatured: false,
    displayOrder: 4,
    projectCompletionState: "Complete",
    coverUrl: "https://example.com/newsora.png",
    githubUrl: "https://github.com/example/newsora",
    liveDemoUrl: "https://newsora.example.com",
    categorizedTechnologies: [{ category: "ARCHITECTURE", name: "Microservices" }],
    updatedAt: new Date().toISOString(),
  },
];

describe("Mobile Responsiveness & UX Remediation", () => {
  describe("1. Dynamic Island & Download Resume Floating Controls Visibility", () => {
    let listeners: Array<(e: MediaQueryListEvent) => void> = [];
    let isMobileMatch = true;
    let originalMatchMedia: typeof window.matchMedia;

    beforeEach(() => {
      listeners = [];
      isMobileMatch = true;
      originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => {
        const isMobileQuery = query.includes("max-width: 767px");
        return {
          get matches() {
            return isMobileQuery ? isMobileMatch : false;
          },
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
            if (event === "change" && isMobileQuery) listeners.push(cb);
          }),
          removeEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
            if (event === "change" && isMobileQuery) {
              listeners = listeners.filter((l) => l !== cb);
            }
          }),
          dispatchEvent: vi.fn(),
        };
      });
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it("MOBILE: is visible in Hero and Contact, but automatically disappears in Me, Experience, Showcase, Certifications", () => {
      isMobileMatch = true;

      render(
        <ThemeProvider>
          <ActiveSectionProvider initialSection="hero">
            <FloatingControlsWrapper />
            <TestSectionSwitcher />
          </ActiveSectionProvider>
        </ThemeProvider>,
      );

      const wrapper = screen.getByTestId("fixed-home-theme-dropdown");
      const status = screen.getByTestId("floating-visible");

      // 1. Hero: VISIBLE
      expect(status).toHaveTextContent("visible");
      expect(wrapper).toHaveAttribute("data-visible", "true");
      expect(wrapper).toHaveClass("opacity-100");
      expect(wrapper).toHaveClass("pointer-events-auto");
      expect(wrapper).toHaveClass("visible");
      expect(wrapper).not.toHaveClass("pointer-events-none");

      // 2. Me: HIDDEN
      fireEvent.click(screen.getByTestId("switch-to-me"));
      expect(status).toHaveTextContent("hidden");
      expect(wrapper).toHaveAttribute("data-visible", "false");
      expect(wrapper).toHaveClass("opacity-0");
      expect(wrapper).toHaveClass("pointer-events-none");
      expect(wrapper).toHaveClass("invisible");

      // 3. Experience: HIDDEN
      fireEvent.click(screen.getByTestId("switch-to-experience"));
      expect(status).toHaveTextContent("hidden");
      expect(wrapper).toHaveAttribute("data-visible", "false");
      expect(wrapper).toHaveClass("opacity-0");
      expect(wrapper).toHaveClass("pointer-events-none");

      // 4. Showcase: HIDDEN
      fireEvent.click(screen.getByTestId("switch-to-showcase"));
      expect(status).toHaveTextContent("hidden");
      expect(wrapper).toHaveAttribute("data-visible", "false");
      expect(wrapper).toHaveClass("opacity-0");
      expect(wrapper).toHaveClass("pointer-events-none");

      // 5. Certifications: HIDDEN
      fireEvent.click(screen.getByTestId("switch-to-certifications"));
      expect(status).toHaveTextContent("hidden");
      expect(wrapper).toHaveAttribute("data-visible", "false");
      expect(wrapper).toHaveClass("opacity-0");
      expect(wrapper).toHaveClass("pointer-events-none");

      // 6. Contact: REAPPEARS (VISIBLE)
      fireEvent.click(screen.getByTestId("switch-to-contact"));
      expect(status).toHaveTextContent("visible");
      expect(wrapper).toHaveAttribute("data-visible", "true");
      expect(wrapper).toHaveClass("opacity-100");
      expect(wrapper).toHaveClass("pointer-events-auto");
      expect(wrapper).toHaveClass("visible");

      // 7. Returning to Hero: REAPPEARS (VISIBLE)
      fireEvent.click(screen.getByTestId("switch-to-hero"));
      expect(status).toHaveTextContent("visible");
      expect(wrapper).toHaveAttribute("data-visible", "true");
      expect(wrapper).toHaveClass("opacity-100");
    });

    it("DESKTOP: always remains visible across every section (bypasses section-based hiding)", () => {
      isMobileMatch = false; // Desktop viewport

      render(
        <ThemeProvider>
          <ActiveSectionProvider initialSection="hero">
            <FloatingControlsWrapper />
            <TestSectionSwitcher />
          </ActiveSectionProvider>
        </ThemeProvider>,
      );

      const wrapper = screen.getByTestId("fixed-home-theme-dropdown");
      const status = screen.getByTestId("floating-visible");

      // Check every section: must ALWAYS be visible on desktop
      const sections: PublicSectionId[] = [
        "hero",
        "me",
        "experience",
        "showcase",
        "certifications",
        "contact",
      ];

      for (const section of sections) {
        fireEvent.click(screen.getByTestId(`switch-to-${section}`));
        expect(status).toHaveTextContent("visible");
        expect(wrapper).toHaveAttribute("data-visible", "true");
        expect(wrapper).toHaveClass("opacity-100");
        expect(wrapper).toHaveClass("pointer-events-auto");
        expect(wrapper).toHaveClass("visible");
        expect(wrapper).toHaveClass("md:opacity-100");
        expect(wrapper).toHaveClass("md:pointer-events-auto");
        expect(wrapper).not.toHaveClass("pointer-events-none");
      }
    });

    it("RESIZING: restores controls when resizing from mobile to desktop and applies rules when resizing to mobile", () => {
      isMobileMatch = true; // Start in mobile

      render(
        <ThemeProvider>
          <ActiveSectionProvider initialSection="hero">
            <FloatingControlsWrapper />
            <TestSectionSwitcher />
          </ActiveSectionProvider>
        </ThemeProvider>,
      );

      const wrapper = screen.getByTestId("fixed-home-theme-dropdown");
      const status = screen.getByTestId("floating-visible");

      // Navigate to "me" on mobile -> hidden
      fireEvent.click(screen.getByTestId("switch-to-me"));
      expect(status).toHaveTextContent("hidden");
      expect(wrapper).toHaveAttribute("data-visible", "false");

      // Resize from mobile to desktop
      act(() => {
        isMobileMatch = false;
        listeners.forEach((cb) =>
          cb({ matches: false } as unknown as MediaQueryListEvent),
        );
      });

      // Controls immediately restored on desktop regardless of active section ("me")
      expect(status).toHaveTextContent("visible");
      expect(wrapper).toHaveAttribute("data-visible", "true");
      expect(wrapper).toHaveClass("opacity-100");
      expect(wrapper).not.toHaveClass("pointer-events-none");

      // Resize back to mobile while on "me" -> immediately hidden
      act(() => {
        isMobileMatch = true;
        listeners.forEach((cb) =>
          cb({ matches: true } as unknown as MediaQueryListEvent),
        );
      });

      expect(status).toHaveTextContent("hidden");
      expect(wrapper).toHaveAttribute("data-visible", "false");
      expect(wrapper).toHaveClass("opacity-0");
      expect(wrapper).toHaveClass("pointer-events-none");

      // Navigate to Contact -> visible on mobile
      fireEvent.click(screen.getByTestId("switch-to-contact"));
      expect(status).toHaveTextContent("visible");
      expect(wrapper).toHaveAttribute("data-visible", "true");
    });
  });

  describe("2. Mobile Vertical Scrolling Strategy", () => {
    it("disables full-page scroll interception and removes transform on mobile viewports", () => {
      // Mock mobile media query
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("max-width: 767px"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <ActiveSectionProvider initialSection="hero">
          <HomeFullScreenDeck>
            <section id="hero" data-testid="test-hero">Hero Content</section>
            <section id="me" data-testid="test-me">Me Content</section>
          </HomeFullScreenDeck>
        </ActiveSectionProvider>,
      );

      const deck = screen.getByTestId("home-continuous-flow");
      const track = screen.getByTestId("home-fullpage-track");

      // Mobile styling: natural flow, overflow-visible, overscroll contain
      expect(deck).toHaveClass("overflow-visible");
      expect(deck).toHaveClass("overscroll-y-contain");
      expect(deck).toHaveClass("h-auto");

      // Transform must be 'none' on mobile (native document flow, no 100svh track offset)
      expect(track.style.transform).toBe("none");

      // Restore matchMedia
      window.matchMedia = originalMatchMedia;
    });
  });

  describe("3. Mobile Showcase Carousel (1 Project Per Viewport)", () => {
    let originalMatchMedia: typeof window.matchMedia;

    beforeEach(() => {
      originalMatchMedia = window.matchMedia;
      // Configure matchMedia for mobile (< 768px)
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("max-width: 767px"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it("renders exactly 1 project card per page on mobile and 1 indicator per project", () => {
      render(<HomeShowcaseSection projects={mockProjects} />);

      // On mobile with 4 projects, totalPages must equal 4 (1 card per page)
      const indicators = screen.getAllByRole("tab");
      expect(indicators).toHaveLength(4);

      // Verify each page contains exactly 1 project card
      for (let i = 0; i < 4; i++) {
        const pageEl = screen.getByTestId(`showcase-page-${i}`);
        expect(pageEl).toBeInTheDocument();
        expect(pageEl.children).toHaveLength(1);
      }

      // First indicator active
      expect(indicators[0]).toHaveAttribute("data-active", "true");
      expect(indicators[0]).toHaveClass("bg-foreground");
      expect(indicators[1]).toHaveAttribute("data-active", "false");
    });

    it("advances exactly 1 project on horizontal touch swipe", () => {
      render(<HomeShowcaseSection projects={mockProjects} />);

      const viewport = screen.getByTestId("home-showcase-carousel-viewport");
      const track = screen.getByTestId("home-showcase-carousel-track");
      const indicators = screen.getAllByRole("tab");

      expect(track.style.transform).toContain("-0%");
      expect(indicators[0]).toHaveAttribute("data-active", "true");

      // Swipe left (advance: diffX = -60)
      act(() => {
        fireEvent.touchStart(viewport, {
          touches: [{ clientX: 200, clientY: 200 }],
        });
        fireEvent.touchMove(viewport, {
          touches: [{ clientX: 140, clientY: 200 }],
        });
        fireEvent.touchEnd(viewport, {
          changedTouches: [{ clientX: 140, clientY: 200 }],
        });
      });

      // Advanced to project index 1
      expect(track.style.transform).toContain("-100%");
      expect(indicators[1]).toHaveAttribute("data-active", "true");
      expect(indicators[0]).toHaveAttribute("data-active", "false");

      // Swipe right (return: diffX = +60)
      act(() => {
        fireEvent.touchStart(viewport, {
          touches: [{ clientX: 140, clientY: 200 }],
        });
        fireEvent.touchMove(viewport, {
          touches: [{ clientX: 200, clientY: 200 }],
        });
        fireEvent.touchEnd(viewport, {
          changedTouches: [{ clientX: 200, clientY: 200 }],
        });
      });

      // Returned to project index 0
      expect(track.style.transform).toContain("-0%");
      expect(indicators[0]).toHaveAttribute("data-active", "true");
    });

    it("clicking separate indicator navigates directly to that project", () => {
      render(<HomeShowcaseSection projects={mockProjects} />);

      const indicators = screen.getAllByRole("tab");
      const track = screen.getByTestId("home-showcase-carousel-track");

      // Click indicator for project 3 (index 2)
      fireEvent.click(indicators[2]!);
      expect(track.style.transform).toContain("-200%");
      expect(indicators[2]).toHaveAttribute("data-active", "true");

      // Click indicator for project 4 (index 3)
      fireEvent.click(indicators[3]!);
      expect(track.style.transform).toContain("-300%");
      expect(indicators[3]).toHaveAttribute("data-active", "true");
    });
  });
});
