import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, fireEvent, act } from "@testing-library/react";
import PublicHomePage from "@/app/(public)/page";
import {
  HomeCertificationsSection,
  HomeExperienceSection,
  HomeHeroSection,
  HomeMeSection,
  HomeShowcaseSection,
} from "@/components/public/home-sections";
import { ThemeProvider } from "@/components/theme/theme-provider";
import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ProjectSummary,
} from "@/types/portfolio";

// Mock repository
vi.mock("@/lib/database/repository", () => ({
  getPortfolioRepository: () => ({
    getPublicPortfolioBundle: async () => ({
      profile: {
        fullName: "Muhamad Fauzan",
        professionalTitle: "Software Engineer",
        location: "Bandung, Indonesia",
        githubUrl: "https://github.com/uzaannnnnn",
        linkedinUrl: "https://linkedin.com/in/zanhoo",
      },
      siteSettings: {
        seo: {
          siteTitle: "Muhamad Fauzan Portfolio",
          metaDescription: "Software Engineer portfolio",
        },
      },
      about: {
        introduction:
          "I am Muhamad Fauzan, a Software Engineer dedicated to designing, implementing, testing, and deploying maintainable software systems.",
        narrativeParagraphs: [
          "My engineering practice centers on clean system boundaries, explicit data modeling, and verifiable behavior across the stack.",
        ],
        engineeringPhilosophyTitle: "Engineering Principles",
        engineeringPhilosophySubtitle: "Core tenets that guide technical decisions.",
        engineeringPillars: [
          {
            id: "pillar-1",
            title: "Architecture & Data Integrity First",
            summary: "Well-defined data schemas and explicit contracts.",
            practices: [],
          },
        ],
        coreDomains: [],
      },
      educations: [],
      experiences: [],
      allPublishedProjects: [],
      certifications: [],
    }),
  }),
}));

describe("Home Full-Screen Presentation Deck, Alignment, Typography, and Section Flow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders horizontally centered Hero content with correct typography hierarchy and social buttons", async () => {
    const pageComponent = await PublicHomePage();
    render(pageComponent);

    // 1. Content container
    const landingContent = screen.getByTestId("home-landing-content");
    expect(landingContent).toBeInTheDocument();
    expect(landingContent).toHaveClass("items-center");
    expect(landingContent).toHaveClass("justify-center");
    expect(landingContent).toHaveClass("text-center");

    // 2. Name: large and bold
    const nameEl = screen.getByTestId("home-name");
    expect(nameEl).toHaveTextContent("Muhamad Fauzan");
    expect(nameEl).toHaveClass("font-bold");
    expect(nameEl).toHaveClass("text-4xl");
    expect(nameEl.tagName.toLowerCase()).toBe("h1");

    // 3. Role: relatively large and normal weight (not bold)
    const roleEl = screen.getByTestId("home-role");
    expect(roleEl).toHaveTextContent("Software Engineer");
    expect(roleEl).toHaveClass("font-normal");
    expect(roleEl).not.toHaveClass("font-bold");
    expect(roleEl).toHaveClass("text-xl");

    // 4. Social Links: exactly 3 compact icon buttons
    const githubBtn = screen.getByTestId("home-social-github");
    expect(githubBtn).toBeInTheDocument();
    expect(githubBtn).toHaveAttribute("href", "https://github.com/uzaannnnnn");
    expect(githubBtn).toHaveAttribute("target", "_blank");
    expect(githubBtn).toHaveAttribute("rel", "noopener noreferrer");
    expect(githubBtn).toHaveClass("no-underline");

    const linkedinBtn = screen.getByTestId("home-social-linkedin");
    expect(linkedinBtn).toBeInTheDocument();
    expect(linkedinBtn).toHaveAttribute("href", "https://linkedin.com/in/zanhoo");
    expect(linkedinBtn).toHaveAttribute("target", "_blank");
    expect(linkedinBtn).toHaveAttribute("rel", "noopener noreferrer");
    expect(linkedinBtn).toHaveClass("no-underline");

    const gmailBtn = screen.getByTestId("home-social-gmail");
    expect(gmailBtn).toBeInTheDocument();
    expect(gmailBtn).toHaveAttribute("href", "mailto:vanz66hu@gmail.com");
    expect(gmailBtn).not.toHaveAttribute("target");
    expect(gmailBtn).toHaveClass("no-underline");

    // 5. Location: small and subtle below social links
    const locationEl = screen.getByTestId("home-location");
    expect(locationEl).toBeInTheDocument();
    expect(locationEl).toHaveTextContent("Bandung, Indonesia");
    expect(locationEl).toHaveClass("text-xs");

    // 6. JSON-LD structured data is present for SEO
    const jsonLd = document.getElementById("portfolio-jsonld");
    expect(jsonLd).toBeInTheDocument();
  });

  it("renders all 6 fixed 100svh full-screen sections in exact order with Footer inside Contact and no Expertise or separate Education section", async () => {
    const pageComponent = await PublicHomePage();
    render(pageComponent);

    const track = screen.getByTestId("home-fullpage-track");
    const children = Array.from(track.children);

    expect(children).toHaveLength(6);
    expect(children[0]).toHaveAttribute("data-testid", "home-landing-content");
    expect(children[1]).toHaveAttribute("data-testid", "home-section-me");
    expect(children[2]).toHaveAttribute("data-testid", "home-section-experience");
    expect(children[3]).toHaveAttribute("data-testid", "home-section-showcase");
    expect(children[4]).toHaveAttribute("data-testid", "home-section-certifications");
    expect(children[5]).toHaveAttribute("data-testid", "home-section-contact");

    // Every section enforces 100svh min/max height and overflow-hidden
    for (const section of children) {
      expect(section).toHaveClass("h-[100svh]");
      expect(section).toHaveClass("min-h-[100svh]");
      expect(section).toHaveClass("max-h-[100svh]");
      expect(section).toHaveClass("overflow-hidden");
    }

    // Education is strictly inside Me, not a separate top-level section
    const meSection = screen.getByTestId("home-section-me");
    expect(within(meSection).getByTestId("home-me-education")).toBeInTheDocument();

    // No Expertise or Skills section exists on Home
    expect(screen.queryByRole("heading", { name: /expertise/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /technical skills/i })).not.toBeInTheDocument();

    // Contact links and minimal Footer are present inside Contact
    const contactSection = screen.getByTestId("home-section-contact");
    expect(within(contactSection).getByTestId("home-contact-email")).toHaveAttribute(
      "href",
      "mailto:vanz66hu@gmail.com",
    );
    expect(within(contactSection).getByTestId("home-contact-github")).toHaveAttribute(
      "href",
      "https://github.com/uzaannnnnn",
    );
    expect(within(contactSection).getByTestId("home-contact-linkedin")).toHaveAttribute(
      "href",
      "https://linkedin.com/in/zanhoo",
    );
    expect(within(contactSection).getByTestId("home-footer")).toHaveTextContent(
      `© ${new Date().getFullYear()} Muhamad Fauzan`,
    );
  });

  it("advances exactly one section per mouse wheel or trackpad burst and allows rapid consecutive gestures without artificial cooldown", async () => {
    const pageComponent = await PublicHomePage();
    render(pageComponent);

    const deck = screen.getByTestId("home-continuous-flow");
    const track = screen.getByTestId("home-fullpage-track");

    expect(deck).toHaveAttribute("data-active-section", "0");
    expect(track.style.transform).toBe("translate3d(0, -0svh, 0)");

    // Simulate a multi-event trackpad gesture burst (e.g., 10 rapid wheel events in one continuous gesture)
    act(() => {
      for (let i = 0; i < 10; i++) {
        fireEvent.wheel(window, { deltaY: 45, deltaX: 0 });
      }
    });

    // Must advance ONLY 1 section (0 -> 1), never skipping to 2+
    expect(deck).toHaveAttribute("data-active-section", "1");
    expect(deck).toHaveAttribute("data-active-section-id", "me");
    expect(track.style.transform).toBe("translate3d(0, -100svh, 0)");

    // A genuinely new gesture shortly after (>= 60ms gesture boundary gap) navigates immediately (1 -> 2) without waiting 650ms
    act(() => {
      vi.advanceTimersByTime(70);
      fireEvent.wheel(window, { deltaY: 80, deltaX: 0 });
    });
    expect(deck).toHaveAttribute("data-active-section", "2");
    expect(deck).toHaveAttribute("data-active-section-id", "experience");
    expect(track.style.transform).toBe("translate3d(0, -200svh, 0)");

    // Another rapid consecutive gesture (2 -> 3) responds immediately
    act(() => {
      vi.advanceTimersByTime(70);
      fireEvent.wheel(window, { deltaY: 80, deltaX: 0 });
    });
    expect(deck).toHaveAttribute("data-active-section", "3");
    expect(deck).toHaveAttribute("data-active-section-id", "showcase");

    // Immediate direction reversal (even 10ms later, 0ms cooldown) navigates back (3 -> 2)
    act(() => {
      vi.advanceTimersByTime(10);
      fireEvent.wheel(window, { deltaY: -80, deltaX: 0 });
    });
    expect(deck).toHaveAttribute("data-active-section", "2");
  });

  it("never triggers a delayed second transition during a 1400ms trackpad momentum stream, yet recognizes a new flick re-accelerating mid-momentum", async () => {
    const pageComponent = await PublicHomePage();
    render(pageComponent);

    const deck = screen.getByTestId("home-continuous-flow");
    expect(deck).toHaveAttribute("data-active-section", "0");

    // Simulate a continuous 1400ms macOS trackpad flick + inertial momentum tail (events every 20ms)
    act(() => {
      for (let t = 0; t <= 1400; t += 20) {
        const decayingDelta = Math.max(2, Math.round(70 * Math.exp(-t / 480)));
        fireEvent.wheel(window, { deltaY: decayingDelta, deltaX: 0 });
        vi.advanceTimersByTime(20);
      }
    });

    // Even at t = 1400ms, must still be on Section 1, NEVER Section 2!
    expect(deck).toHaveAttribute("data-active-section", "1");
    expect(deck).toHaveAttribute("data-active-section-id", "me");

    // Now test a new physical flick re-accelerating while momentum is still decaying (no silence gap needed!)
    act(() => {
      // Momentum currently decayed to 4px, user pushes fingers again spiking deltaY to 36px
      fireEvent.wheel(window, { deltaY: 36, deltaX: 0 });
    });
    expect(deck).toHaveAttribute("data-active-section", "2");

    // Immediate direction reversal advances 2 -> 1 with zero waiting
    act(() => {
      fireEvent.wheel(window, { deltaY: -60, deltaX: 0 });
    });
    expect(deck).toHaveAttribute("data-active-section", "1");
  });

  it("supports keyboard navigation (ArrowDown/Up, PageDown/Up, Space/Shift+Space, Home/End) and respects section boundaries", async () => {
    const pageComponent = await PublicHomePage();
    render(pageComponent);

    const deck = screen.getByTestId("home-continuous-flow");

    // At section 0: ArrowUp stays at 0 and does not lock out ArrowDown
    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(deck).toHaveAttribute("data-active-section", "0");

    // Rapid consecutive key presses navigate immediately without artificial cooldowns
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(deck).toHaveAttribute("data-active-section", "1");

    fireEvent.keyDown(window, { key: "PageDown" });
    expect(deck).toHaveAttribute("data-active-section", "2");

    fireEvent.keyDown(window, { key: " " });
    expect(deck).toHaveAttribute("data-active-section", "3");

    fireEvent.keyDown(window, { key: " ", shiftKey: true });
    expect(deck).toHaveAttribute("data-active-section", "2");

    fireEvent.keyDown(window, { key: "End" });
    expect(deck).toHaveAttribute("data-active-section", "5");
    expect(deck).toHaveAttribute("data-active-section-id", "contact");

    // At last section (5): ArrowDown stays at 5
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(deck).toHaveAttribute("data-active-section", "5");

    // Home -> jumps back to section 0 (Hero)
    fireEvent.keyDown(window, { key: "Home" });
    expect(deck).toHaveAttribute("data-active-section", "0");
    expect(deck).toHaveAttribute("data-active-section-id", "hero");

    // Holding down ArrowDown (repeat: true) must NOT advance a second section
    fireEvent.keyDown(window, { key: "ArrowDown", repeat: false });
    expect(deck).toHaveAttribute("data-active-section", "1");
    fireEvent.keyDown(window, { key: "ArrowDown", repeat: true });
    expect(deck).toHaveAttribute("data-active-section", "1");
  });

  it("supports mobile touch swipe gestures (1 swipe = 1 section, responsive consecutive swipes)", async () => {
    const pageComponent = await PublicHomePage();
    render(pageComponent);

    const deck = screen.getByTestId("home-continuous-flow");
    expect(deck).toHaveAttribute("data-active-section", "0");

    // Swipe 1 up (scroll down to next section: 0 -> 1)
    fireEvent.touchStart(deck, {
      touches: [{ clientX: 200, clientY: 500 }],
    });
    fireEvent.touchEnd(deck, {
      changedTouches: [{ clientX: 200, clientY: 320 }],
    });
    expect(deck).toHaveAttribute("data-active-section", "1");

    // Duplicate touchend without a new touchstart is ignored (1 gesture = 1 transition)
    fireEvent.touchEnd(deck, {
      changedTouches: [{ clientX: 200, clientY: 200 }],
    });
    expect(deck).toHaveAttribute("data-active-section", "1");

    // Immediate second intentional swipe (new touchstart -> touchend) navigates 1 -> 2 without artificial cooldown
    fireEvent.touchStart(deck, {
      touches: [{ clientX: 200, clientY: 500 }],
    });
    fireEvent.touchEnd(deck, {
      changedTouches: [{ clientX: 200, clientY: 320 }],
    });
    expect(deck).toHaveAttribute("data-active-section", "2");

    // Swipe down returns to section 1 immediately
    fireEvent.touchStart(deck, {
      touches: [{ clientX: 200, clientY: 300 }],
    });
    fireEvent.touchEnd(deck, {
      changedTouches: [{ clientX: 200, clientY: 520 }],
    });
    expect(deck).toHaveAttribute("data-active-section", "1");
  });

  it("renders Education records inside Me when published education entries exist", () => {
    const educations: EducationItem[] = [
      {
        id: "edu-1",
        institution: "Institut Teknologi Bandung",
        degree: "Bachelor of Engineering",
        major: "Informatics",
        startDate: "2020",
        endDate: "2024",
        isCurrent: false,
        gpa: "3.85 / 4.00",
        thesisTitle: null,
        defenseGrade: null,
        description: "Focused on software engineering and distributed systems.",
        displayOrder: 1,
        status: "published",
      },
    ];

    render(<HomeMeSection educations={educations} />);
    const eduContainer = screen.getByTestId("home-me-education");
    expect(within(eduContainer).getByText("Institut Teknologi Bandung")).toBeInTheDocument();
    expect(
      within(eduContainer).getByText(/Bachelor of Engineering in Informatics/),
    ).toBeInTheDocument();
    expect(within(eduContainer).getByText("GPA: 3.85 / 4.00")).toBeInTheDocument();
  });

  it("sorts Experience entries in reverse chronological order", () => {
    const experiences: ExperienceItem[] = [
      {
        id: "exp-older",
        organization: "Earlier Corp",
        role: "Junior Software Engineer",
        employmentType: "Full-time",
        workSystem: "Hybrid",
        location: "Bandung",
        startMonth: 1,
        startYear: 2023,
        endMonth: 12,
        endYear: 2023,
        isCurrent: false,
        description: "Built core backend modules.",
        responsibilities: ["Implemented REST APIs"],
        technicalContributions: [],
        achievements: [],
        technologies: ["TypeScript", "PostgreSQL"],
        displayOrder: 2,
        status: "published",
      },
      {
        id: "exp-current",
        organization: "Current Tech",
        role: "Software Engineer",
        employmentType: "Full-time",
        workSystem: "Remote",
        location: "Indonesia",
        startMonth: 2,
        startYear: 2024,
        endMonth: null,
        endYear: null,
        isCurrent: true,
        description: "Leading platform engineering.",
        responsibilities: ["Designed service architecture"],
        technicalContributions: [],
        achievements: [],
        technologies: ["Next.js", "Go"],
        displayOrder: 1,
        status: "published",
      },
    ];

    render(<HomeExperienceSection experiences={experiences} />);
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(2);
    expect(articles[0]).toHaveAttribute("data-testid", "home-experience-item-exp-current");
    expect(articles[1]).toHaveAttribute("data-testid", "home-experience-item-exp-older");
  });

  it("enforces strict publication safeguard in Showcase: hides draft projects (GeoEntity, ClayCV, SPK Bansos SAW) and shows only published projects", () => {
    const mixedProjects: ProjectSummary[] = [
      {
        id: "proj-geoentity",
        slug: "geoentity",
        name: "GeoEntity",
        description: "Draft geospatial platform",
        category: "Geospatial",
        technologies: ["PostGIS"],
        coverUrl: null,
        githubUrl: null,
        liveDemoUrl: null,
        projectCompletionState: "In Development",
        status: "draft",
        isFeatured: false,
        displayOrder: 1,
        updatedAt: "2026-03-01T00:00:00Z",
      },
      {
        id: "proj-claycv",
        slug: "claycv",
        name: "ClayCV",
        description: "Draft resume platform",
        category: "Web Application",
        technologies: ["Next.js"],
        coverUrl: null,
        githubUrl: null,
        liveDemoUrl: null,
        projectCompletionState: "In Development",
        status: "draft",
        isFeatured: false,
        displayOrder: 2,
        updatedAt: "2026-03-01T00:00:00Z",
      },
      {
        id: "proj-spk",
        slug: "spk-bansos-saw",
        name: "SPK Bansos SAW",
        description: "Draft decision support system",
        category: "Decision Support",
        technologies: ["TypeScript"],
        coverUrl: null,
        githubUrl: null,
        liveDemoUrl: null,
        projectCompletionState: "In Development",
        status: "draft",
        isFeatured: false,
        displayOrder: 3,
        updatedAt: "2026-03-01T00:00:00Z",
      },
      {
        id: "proj-published",
        slug: "verified-system",
        name: "Verified Production System",
        description: "Published production system architecture.",
        category: "Systems Engineering",
        technologies: ["TypeScript", "PostgreSQL"],
        coverUrl: null,
        githubUrl: "https://github.com/uzaannnnnn/verified-system",
        liveDemoUrl: "https://example.com",
        projectCompletionState: "Production",
        status: "published",
        isFeatured: true,
        displayOrder: 4,
        updatedAt: "2026-03-01T00:00:00Z",
      },
    ];

    render(<HomeShowcaseSection projects={mixedProjects} />);

    // Draft projects must NEVER appear
    expect(screen.queryByText("GeoEntity")).not.toBeInTheDocument();
    expect(screen.queryByText("ClayCV")).not.toBeInTheDocument();
    expect(screen.queryByText("SPK Bansos SAW")).not.toBeInTheDocument();

    // Published project appears with its links and tags
    expect(screen.getByText("Verified Production System")).toBeInTheDocument();
    expect(screen.getByTestId("home-showcase-item-verified-system")).toBeInTheDocument();
  });

  it("omits expiration label in Certifications when expiration date is null, and shows it when present", () => {
    const certifications: CertificationItem[] = [
      {
        id: "cert-no-exp",
        name: "Software Architecture Credential",
        issuingOrganization: "IEEE",
        issueMonth: 5,
        issueYear: 2025,
        expirationMonth: null,
        expirationYear: null,
        credentialId: "ARCH-01",
        credentialUrl: "https://example.com/cert/arch-01",
        certificateMediaUrl: null,
        description: null,
        displayOrder: 1,
        status: "published",
      },
      {
        id: "cert-with-exp",
        name: "Cloud Practitioner",
        issuingOrganization: "Cloud Institute",
        issueMonth: 1,
        issueYear: 2024,
        expirationMonth: 1,
        expirationYear: 2027,
        credentialId: null,
        credentialUrl: null,
        certificateMediaUrl: null,
        description: null,
        displayOrder: 2,
        status: "published",
      },
    ];

    render(<HomeCertificationsSection certifications={certifications} />);

    expect(
      screen.queryByTestId("home-certification-expiration-cert-no-exp"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("home-certification-expiration-cert-with-exp"),
    ).toHaveTextContent("Expires Jan 2027");
  });

  it("renders minimal visitor counter directly below location with formatted English count", async () => {
    vi.useRealTimers();
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 1420 }),
    });

    try {
      sessionStorage.clear();
      render(<HomeHeroSection />);

      const locationEl = screen.getByTestId("home-location");
      const counterEl = await screen.findByTestId("home-visitor-counter");

      expect(counterEl).toBeInTheDocument();
      expect(counterEl).toHaveTextContent("1.42k visitors");
      expect(locationEl.nextElementSibling).toBe(counterEl);
      expect(counterEl.querySelector("svg")).toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("renders Indonesian visitor count with comma decimal separator and pengunjung label when language is id", async () => {
    vi.useRealTimers();
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 1420 }),
    });

    try {
      sessionStorage.clear();
      localStorage.setItem("portfolio_language", "id");

      render(
        <ThemeProvider>
          <HomeHeroSection />
        </ThemeProvider>,
      );

      const counterEl = await screen.findByTestId("home-visitor-counter");
      expect(counterEl).toBeInTheDocument();
      expect(counterEl).toHaveTextContent("1,42k pengunjung");
    } finally {
      localStorage.clear();
      global.fetch = originalFetch;
    }
  });

  it("gracefully omits visitor counter without error when visitor endpoint fails", async () => {
    vi.useRealTimers();
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    });

    try {
      sessionStorage.clear();
      render(<HomeHeroSection />);

      // Hero content renders normally
      expect(screen.getByTestId("home-location")).toBeInTheDocument();
      expect(screen.queryByTestId("home-visitor-counter")).not.toBeInTheDocument();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("sends GET instead of POST when visitor was already counted in current session", async () => {
    vi.useRealTimers();
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 500 }),
    });
    global.fetch = fetchMock;

    try {
      sessionStorage.setItem("mf_visit_counted", "1");
      render(<HomeHeroSection />);

      const counterEl = await screen.findByTestId("home-visitor-counter");
      expect(counterEl).toHaveTextContent("500 visitors");

      // Verify GET was sent, not POST
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs).toBeDefined();
      expect(callArgs?.[0]).toBe("/api/visitors");
      expect(callArgs?.[1]?.method).toBe("GET");
    } finally {
      sessionStorage.clear();
      global.fetch = originalFetch;
    }
  });
});
