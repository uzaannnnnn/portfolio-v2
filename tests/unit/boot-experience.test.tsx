import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import * as React from "react";
import * as fs from "fs";
import * as path from "path";
import * as opentype from "opentype.js";
import {
  IndonesianBootExperience,
  BOOT_EXPERIENCE_STORAGE_KEY,
  resetBootExperienceSession,
} from "@/components/boot-experience/indonesian-boot-experience";
import {
  hasAllGlyphs,
  getGlyphPaths,
  commandsToSvgPathData,
  getGreetingOriginLabel,
  getDynamicFontSize,
  selectControlledRandomFont,
  ALL_HANDWRITING_FONT_OPTIONS,
  ALL_HANDWRITING_FONT_IDS,
  HANDWRITING_FONTS,
  DEFAULT_HANDWRITING_FONT_ID,
} from "@/lib/boot/handwriting-font";
import type { BootGreeting, BootWelcomeConfig, HandwritingFontId } from "@/types/portfolio";

const { MockMotionElement } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const MockComp = React.forwardRef(
    (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      props: any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref: any,
    ) => {
      const {
        children,
        initial: _i,
        animate: _a,
        exit: _e,
        transition: _t,
        d: _d,
        pathLength: _pl,
        fillOpacity: _fo,
        strokeOpacity: _so,
        ...cleanProps
      } = props;
      return (
        <div ref={ref} {...cleanProps}>
          {children}
        </div>
      );
    },
  );
  MockComp.displayName = "MockMotionElement";
  return { MockMotionElement: MockComp };
});

vi.mock("motion/react", () => {
  return {
    useReducedMotion: () => false,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: MockMotionElement,
      p: MockMotionElement,
      path: MockMotionElement,
      text: MockMotionElement,
    },
  };
});

const MOCK_GREETINGS: BootGreeting[] = [
  {
    id: "greet-1",
    language: "Indonesian",
    greeting: "Selamat Datang",
    meaning: "Welcome",
    regionNote: "Indonesia",
    isEnabled: true,
    displayOrder: 1,
    status: "published",
  },
  {
    id: "greet-2",
    language: "Sundanese",
    greeting: "Wilujeng Sumping",
    meaning: "Welcome",
    regionNote: "West Java, Indonesia",
    isEnabled: true,
    displayOrder: 2,
    status: "published",
  },
  {
    id: "greet-draft",
    language: "Secret Lang",
    greeting: "Rahasia",
    meaning: "Hidden",
    isEnabled: true,
    displayOrder: 3,
    status: "draft", // should be excluded
  },
];

const MOCK_CONFIG: BootWelcomeConfig = {
  enabled: true,
  intervalMs: 1500,
  welcomeName: "Muhamad Fauzan",
  welcomeTitle: "Software Engineer",
  welcomeMessage: "Welcome to my portfolio.",
};

describe("Booting Screen (Randomized Handwriting Font & Origin Identity Preservation)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetBootExperienceSession();
    window.localStorage.removeItem(BOOT_EXPERIENCE_STORAGE_KEY);
  });

  afterEach(() => {
    vi.useRealTimers();
    resetBootExperienceSession();
    window.localStorage.removeItem(BOOT_EXPERIENCE_STORAGE_KEY);
  });

  it("renders preserved greeting origin label in pure black (#000000) and handwriting greeting at center without header, footer, or font selector UI", () => {
    render(
      <IndonesianBootExperience greetings={MOCK_GREETINGS} config={MOCK_CONFIG}>
        <div data-testid="portfolio-main-page">Main Content</div>
      </IndonesianBootExperience>,
    );

    // Overlay is open
    const overlay = screen.getByTestId("boot-experience-overlay");
    expect(overlay).toBeInTheDocument();

    // Verify center alignment and click-to-skip cursor classes on overlay
    expect(overlay.className).toContain("flex");
    expect(overlay.className).toContain("items-center");
    expect(overlay.className).toContain("justify-center");
    expect(overlay.className).toContain("cursor-pointer");

    // Origin label is preserved, rendered above greeting, and styled in pure black (#000000)
    const originLabel = screen.getByTestId("boot-origin-label");
    expect(originLabel).toBeInTheDocument();
    expect(originLabel).toHaveTextContent("INDONESIA");
    expect(originLabel.className).toContain("text-[#000000]");

    // Only greeting stage is present
    const greetingStage = screen.getByTestId("boot-greeting-stage");
    expect(greetingStage).toBeInTheDocument();
    expect(greetingStage).toHaveTextContent("Selamat Datang");

    // Header section completely removed
    expect(screen.queryByText(/Nusantara Welcome/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("boot-jump-welcome-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("boot-skip-button")).not.toBeInTheDocument();

    // Footer section completely removed
    expect(screen.queryByTestId("boot-direct-enter-button")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Greeting sequence progress/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Press Esc to enter/i)).not.toBeInTheDocument();

    // No font selector UI
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText(/Font Selector/i)).not.toBeInTheDocument();

    // Welcome card completely removed
    expect(screen.queryByTestId("boot-welcome-stage")).not.toBeInTheDocument();
    expect(screen.queryByTestId("boot-enter-portfolio-button")).not.toBeInTheDocument();
  });

  it("allows clicking anywhere on the screen to skip immediately without persisting flag", () => {
    render(
      <IndonesianBootExperience greetings={MOCK_GREETINGS} config={MOCK_CONFIG}>
        <div data-testid="portfolio-main-page">Main Content</div>
      </IndonesianBootExperience>,
    );

    const overlay = screen.getByTestId("boot-experience-overlay");
    expect(overlay).toBeInTheDocument();

    // Click anywhere on the overlay
    act(() => {
      fireEvent.click(overlay);
    });

    // Boot screen dismissed immediately
    expect(screen.queryByTestId("boot-experience-overlay")).not.toBeInTheDocument();
    // Must NOT persist status to localStorage
    expect(window.localStorage.getItem(BOOT_EXPERIENCE_STORAGE_KEY)).toBeNull();
  });

  it("allows skipping via Enter and Space keyboard shortcuts", () => {
    const { unmount } = render(
      <IndonesianBootExperience greetings={MOCK_GREETINGS} config={MOCK_CONFIG}>
        <div data-testid="portfolio-main-page">Main Content</div>
      </IndonesianBootExperience>,
    );

    expect(screen.getByTestId("boot-experience-overlay")).toBeInTheDocument();

    // Press Enter
    act(() => {
      fireEvent.keyDown(window, { key: "Enter" });
    });
    expect(screen.queryByTestId("boot-experience-overlay")).not.toBeInTheDocument();

    unmount();
    resetBootExperienceSession();

    // Test Space key
    render(
      <IndonesianBootExperience greetings={MOCK_GREETINGS} config={MOCK_CONFIG}>
        <div data-testid="portfolio-main-page">Main Content</div>
      </IndonesianBootExperience>,
    );
    expect(screen.getByTestId("boot-experience-overlay")).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });
    expect(screen.queryByTestId("boot-experience-overlay")).not.toBeInTheDocument();
  });

  it("always shows boot screen on fresh page load/refresh even if localStorage had stale flag", () => {
    // Simulate stale persistent flag left by old code
    window.localStorage.setItem(BOOT_EXPERIENCE_STORAGE_KEY, "1");

    // Fresh session (simulating page reload)
    resetBootExperienceSession();

    render(
      <IndonesianBootExperience greetings={MOCK_GREETINGS} config={MOCK_CONFIG}>
        <div data-testid="portfolio-main-page">Main Content</div>
      </IndonesianBootExperience>,
    );

    // Boot screen MUST be shown on every refresh
    expect(screen.getByTestId("boot-experience-overlay")).toBeInTheDocument();
    // Stale key should be purged from localStorage
    expect(window.localStorage.getItem(BOOT_EXPERIENCE_STORAGE_KEY)).toBeNull();
  });

  it("does not re-open boot screen during internal page navigations after dismissal in same session", () => {
    const { rerender } = render(
      <IndonesianBootExperience greetings={MOCK_GREETINGS} config={MOCK_CONFIG}>
        <div data-testid="portfolio-page-home">Home Page Content</div>
      </IndonesianBootExperience>,
    );

    const overlay = screen.getByTestId("boot-experience-overlay");
    expect(overlay).toBeInTheDocument();

    // Dismiss boot screen
    act(() => {
      fireEvent.click(overlay);
    });
    expect(screen.queryByTestId("boot-experience-overlay")).not.toBeInTheDocument();

    // Simulate internal SPA navigation (rerendering layout with new page without full browser reload)
    rerender(
      <IndonesianBootExperience greetings={MOCK_GREETINGS} config={MOCK_CONFIG}>
        <div data-testid="portfolio-page-projects">Projects Directory Content</div>
      </IndonesianBootExperience>,
    );

    // Boot screen stays closed during internal SPA navigation
    expect(screen.queryByTestId("boot-experience-overlay")).not.toBeInTheDocument();
    expect(screen.getByTestId("portfolio-page-projects")).toBeInTheDocument();
  });

  it("synchronously keeps home content boundary hidden on initial render and reveals it after booting completes", () => {
    render(
      <IndonesianBootExperience greetings={MOCK_GREETINGS} config={MOCK_CONFIG}>
        <div data-testid="portfolio-page-home">Home Landing Page</div>
      </IndonesianBootExperience>,
    );

    // Initial render: overlay is synchronously open from frame 0
    const overlay = screen.getByTestId("boot-experience-overlay");
    expect(overlay).toBeInTheDocument();

    // Content wrapper is synchronously invisible, opacity-0, and pointer-events-none
    const contentWrapper = screen.getByTestId("boot-experience-content-wrapper");
    expect(contentWrapper).toBeInTheDocument();
    expect(contentWrapper).toHaveClass("invisible");
    expect(contentWrapper).toHaveClass("opacity-0");
    expect(contentWrapper).toHaveClass("pointer-events-none");
    expect(contentWrapper).toHaveAttribute("aria-hidden", "true");

    // Dismiss boot screen
    act(() => {
      fireEvent.click(overlay);
    });

    // Content wrapper is now visible, opacity-100, and interactive
    expect(contentWrapper).toHaveClass("visible");
    expect(contentWrapper).toHaveClass("opacity-100");
    expect(contentWrapper).not.toHaveClass("pointer-events-none");
    expect(contentWrapper).toHaveAttribute("aria-hidden", "false");
    expect(screen.queryByTestId("boot-experience-overlay")).not.toBeInTheDocument();
  });

  it("preserves greeting origin identity and cycles through greetings with automated font randomization", () => {
    render(
      <IndonesianBootExperience greetings={MOCK_GREETINGS} config={MOCK_CONFIG}>
        <div data-testid="portfolio-main-page">Main Content</div>
      </IndonesianBootExperience>,
    );

    // Initial greeting: Indonesian (regionNote: Indonesia)
    expect(screen.getByTestId("boot-origin-label")).toHaveTextContent("INDONESIA");
    expect(screen.getByTestId("boot-origin-label").className).toContain("text-[#000000]");
    expect(screen.getByTestId("boot-greeting-stage")).toHaveTextContent("Selamat Datang");

    // Advance by interval
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // Second greeting: Sundanese (regionNote: West Java, Indonesia)
    expect(screen.getByTestId("boot-origin-label")).toHaveTextContent("WEST JAVA, INDONESIA");
    expect(screen.getByTestId("boot-greeting-stage")).toHaveTextContent("Wilujeng Sumping");

    // Draft greeting is excluded, so after 2nd greeting it finishes sequence
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // Overlay should close without writing to localStorage
    expect(screen.queryByTestId("boot-experience-overlay")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(BOOT_EXPERIENCE_STORAGE_KEY)).toBeNull();
  });

  it("controlled random selection avoids back-to-back font repetitions and samples available options", () => {
    let prevFont: HandwritingFontId | undefined = undefined;
    const sampledFonts = new Set<HandwritingFontId>();

    for (let i = 0; i < 40; i++) {
      const selected = selectControlledRandomFont("Selamat Datang", prevFont);

      // Must be one of the 6 valid fonts
      expect(ALL_HANDWRITING_FONT_IDS).toContain(selected);

      // Must NEVER repeat the immediately preceding font when alternatives exist
      if (prevFont !== undefined) {
        expect(selected).not.toBe(prevFont);
      }

      sampledFonts.add(selected);
      prevFont = selected;
    }

    // Over 40 random picks with 6 candidates, all 6 candidates should be sampled
    expect(sampledFonts.size).toBe(ALL_HANDWRITING_FONT_IDS.length);
  });

  it("closes immediately on Escape key press", () => {
    render(
      <IndonesianBootExperience greetings={MOCK_GREETINGS} config={MOCK_CONFIG}>
        <div data-testid="portfolio-main-page">Main Content</div>
      </IndonesianBootExperience>,
    );

    expect(screen.getByTestId("boot-experience-overlay")).toBeInTheDocument();

    // Press Escape
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    expect(screen.queryByTestId("boot-experience-overlay")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(BOOT_EXPERIENCE_STORAGE_KEY)).toBeNull();
  });

  describe("Origin Label Helper", () => {
    it("returns regionNote uppercase if provided, or falls back to language uppercase", () => {
      expect(
        getGreetingOriginLabel({ language: "Sundanese", regionNote: "West Java, Indonesia" }),
      ).toBe("WEST JAVA, INDONESIA");

      expect(getGreetingOriginLabel({ language: "Balinese", regionNote: "Bali, Indonesia" })).toBe(
        "BALI, INDONESIA",
      );

      expect(getGreetingOriginLabel({ language: "Javanese", regionNote: "" })).toBe("JAVANESE");

      expect(getGreetingOriginLabel({ language: "Bugis", regionNote: null })).toBe("BUGIS");
    });
  });

  describe("6 Distinct Handwriting Fonts Vector Verification", () => {
    it("verifies all 6 handwriting font definitions exist and are properly categorized", () => {
      expect(ALL_HANDWRITING_FONT_OPTIONS).toHaveLength(6);
      expect(DEFAULT_HANDWRITING_FONT_ID).toBe("dancing-script");

      const categories = ALL_HANDWRITING_FONT_OPTIONS.map((f) => f.category);
      expect(categories).toContain("Elegant Script");
      expect(categories).toContain("Casual Handwriting");
      expect(categories).toContain("Classic Calligraphy");
      expect(categories).toContain("Minimal Monoline");
      expect(categories).toContain("Modern Signature");
      expect(categories).toContain("Artistic Script");
    });

    const verifiedGreetings = [
      "Selamat Datang",
      "Wilujeng Sumping",
      "Sugeng Rawuh",
      "Rahajeng Rauh",
      "Salamaik Datang",
      "Horas",
      "Tabe'",
      "Peumulia Jamee",
      "Salamat Datang",
      "Kawa Ma Kawa",
    ];

    const fontFiles: Record<HandwritingFontId, string> = {
      "dancing-script": "DancingScript.ttf",
      caveat: "Caveat.ttf",
      "alex-brush": "AlexBrush.ttf",
      sacramento: "Sacramento.ttf",
      "marck-script": "MarckScript.ttf",
      allura: "Allura.ttf",
    };

    for (const [fontId, fileName] of Object.entries(fontFiles) as [HandwritingFontId, string][]) {
      it(`decomposes all 10 verified greetings with ${HANDWRITING_FONTS[fontId].name} (${HANDWRITING_FONTS[fontId].category})`, () => {
        const fontPath = path.resolve(__dirname, "../../public/fonts", fileName);
        expect(fs.existsSync(fontPath)).toBe(true);

        const fontBuffer = fs.readFileSync(fontPath);
        const font = opentype.parse(fontBuffer.buffer);

        for (const greeting of verifiedGreetings) {
          expect(hasAllGlyphs(font, greeting)).toBe(true);
          const layout = getGlyphPaths(font, greeting);
          expect(layout).not.toBeNull();
          expect(layout?.glyphs.length).toBeGreaterThan(0);
          expect(layout?.totalDrawTime).toBeGreaterThan(0.4);
          expect(layout?.viewBox).toMatch(
            /^-?\d+(\.\d+)?\s+-?\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?$/,
          );

          // Regression check: ensure no glyph path string contains NaN, undefined, or invalid SVG tokens
          for (const glyph of layout!.glyphs) {
            expect(glyph.d).not.toContain("NaN");
            expect(glyph.d).not.toContain("undefined");
            expect(glyph.d).not.toContain("Infinity");
            expect(glyph.d).toMatch(/^[MLCQZ0-9.\-\s]+$/);
          }

          // Zero-clipping verification: verify all glyph paths + stroke buffer are strictly inside viewBox
          const vbParts = layout!.viewBox.split(" ").map(Number);
          const vbMinX = vbParts[0] ?? 0;
          const vbMinY = vbParts[1] ?? 0;
          const vbWidth = vbParts[2] ?? 0;
          const vbHeight = vbParts[3] ?? 0;
          const vbMaxX = vbMinX + vbWidth;
          const vbMaxY = vbMinY + vbHeight;
          const strokeBuffer = 5; // strokeWidth 1.8 + round caps / miters

          const dynamicSize = getDynamicFontSize(greeting);
          font.forEachGlyph(greeting, 0, 0, dynamicSize, undefined, (glyph, x, y, size) => {
            const p = glyph.getPath(x, y, size);
            if (p.commands && p.commands.length > 0) {
              const gbb = p.getBoundingBox();
              expect(gbb.x1 - strokeBuffer).toBeGreaterThanOrEqual(vbMinX);
              expect(gbb.y1 - strokeBuffer).toBeGreaterThanOrEqual(vbMinY);
              expect(gbb.x2 + strokeBuffer).toBeLessThanOrEqual(vbMaxX);
              expect(gbb.y2 + strokeBuffer).toBeLessThanOrEqual(vbMaxY);
            }
          });
        }
      });
    }

    it("prevents NaN corruption in SVG path serialization when coordinates have scientific-notation floating-point remainders (< 1e-6)", () => {
      // Exact floating-point edge cases that caused opentype.js Path.prototype.toPathData(2)
      // to concatenate "5.684341886080802e-14" + "e+2" -> NaN and truncate glyphs mid-stroke
      const edgeCaseCommands: opentype.PathCommand[] = [
        { type: "M", x: 369 + 5.684341886080802e-14, y: -18 },
        {
          type: "Q",
          x1: 410 + 5.684341886080802e-14,
          y1: -0.33,
          x: 492 + 5.684341886080802e-14,
          y: -24.19,
        },
        {
          type: "C",
          x1: 180 + 1e-12,
          y1: -12 - 1e-13,
          x2: 205 + 2.842170943040401e-14,
          y2: -16.4,
          x: 220,
          y: -0.000000001,
        },
        { type: "L", x: 369 + 5.684341886080802e-14, y: -18 },
        { type: "Z" },
      ];

      const d = commandsToSvgPathData(edgeCaseCommands, 2);
      expect(d).not.toContain("NaN");
      expect(d).toBe("M369 -18Q410 -0.33 492 -24.19C180 -12 205 -16.4 220 0L369 -18Z");
    });

    it("scales font size dynamically based on greeting length to prevent edge clipping", () => {
      // Short greetings (len <= 5)
      expect(getDynamicFontSize("Horas")).toBe(116);
      expect(getDynamicFontSize("Tabe'")).toBe(116);

      // Medium greetings (6 <= len <= 12)
      expect(getDynamicFontSize("Sugeng Rawuh")).toBe(92);
      expect(getDynamicFontSize("Kawa Ma Kawa")).toBe(92);

      // Longer greetings (13 <= len <= 15)
      expect(getDynamicFontSize("Selamat Datang")).toBe(82);
      expect(getDynamicFontSize("Salamaik Datang")).toBe(82);

      // Longest greetings (len > 15)
      expect(getDynamicFontSize("Wilujeng Sumping")).toBe(74);
    });

    it("gracefully detects non-Latin scripts (Japanese/Chinese/Arabic) across fonts for multilingual fallback", () => {
      const fontBuffer = fs.readFileSync(
        path.resolve(__dirname, "../../public/fonts/DancingScript.ttf"),
      );
      const font = opentype.parse(fontBuffer.buffer);

      expect(hasAllGlyphs(font, "こんにちは")).toBe(false);
      expect(hasAllGlyphs(font, "مرحبا")).toBe(false);
      expect(hasAllGlyphs(font, "你好")).toBe(false);

      const nonLatinLayout = getGlyphPaths(font, "こんにちは");
      expect(nonLatinLayout).toBeNull(); // triggers SVG <text> multilingual fallback
    });
  });
});
