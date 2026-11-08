import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import * as React from "react";
import fs from "fs";
import path from "path";
import {
  ThemeProvider,
  useTheme,
  THEME_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  calculateRadialRevealGeometry,
} from "@/components/theme/theme-provider";
import { ThemeDropdown, ThemeSwitcher } from "@/components/theme/theme-switcher";
import type { ActiveResume } from "@/types/portfolio";

function ThemeConsumer() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button data-testid="set-dark" onClick={() => setTheme("dark")}>
        Dark
      </button>
      <button data-testid="set-light" onClick={() => setTheme("light")}>
        Light
      </button>
      <button data-testid="set-system" onClick={() => setTheme("system")}>
        System
      </button>
    </div>
  );
}

describe("Global Theme System, Icon-Only Toggle, Tooltip, and Radial Reveal Transition", () => {
  let listeners: Array<(e: MediaQueryListEvent) => void> = [];
  let matchesDark = false;
  let prefersReducedMotion = false;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-transition");
    document.documentElement.style.colorScheme = "";
    document.documentElement.style.removeProperty("--theme-ripple-x");
    document.documentElement.style.removeProperty("--theme-ripple-y");
    document.documentElement.style.removeProperty("--theme-ripple-r");
    delete (document as { startViewTransition?: unknown }).startViewTransition;
    listeners = [];
    matchesDark = false;
    prefersReducedMotion = false;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-color-scheme: dark")
          ? matchesDark
          : query.includes("prefers-reduced-motion: reduce")
            ? prefersReducedMotion
            : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(
          (event: string, callback: (e: MediaQueryListEvent) => void) => {
            if (event === "change" && query.includes("prefers-color-scheme: dark")) {
              listeners.push(callback);
            }
          },
        ),
        removeEventListener: vi.fn(
          (event: string, callback: (e: MediaQueryListEvent) => void) => {
            if (event === "change") {
              listeners = listeners.filter((l) => l !== callback);
            }
          },
        ),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to 'system' theme when no stored preference exists", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved-theme").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("resolves to 'dark' in system mode when OS prefers dark", () => {
    matchesDark = true;

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved-theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("restores manual 'dark' preference from localStorage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme").textContent).toBe("dark");
    expect(screen.getByTestId("resolved-theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("restores manual 'light' preference from localStorage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme").textContent).toBe("light");
    expect(screen.getByTestId("resolved-theme").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("updates DOM and localStorage when user explicitly switches theme", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    // Switch to dark
    act(() => {
      fireEvent.click(screen.getByTestId("set-dark"));
    });

    expect(screen.getByTestId("current-theme").textContent).toBe("dark");
    expect(screen.getByTestId("resolved-theme").textContent).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");

    // Switch to light
    act(() => {
      fireEvent.click(screen.getByTestId("set-light"));
    });

    expect(screen.getByTestId("current-theme").textContent).toBe("light");
    expect(screen.getByTestId("resolved-theme").textContent).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("dynamically reacts to OS prefers-color-scheme changes when in system mode", () => {
    const startViewTransitionMock = vi.fn((cb: () => void) => {
      cb();
      return {
        ready: Promise.resolve(),
        finished: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      };
    });
    (document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("resolved-theme").textContent).toBe("light");
    expect(startViewTransitionMock).toHaveBeenCalledTimes(0);

    // Simulate OS switching to dark mode -> triggers radial transition
    act(() => {
      matchesDark = true;
      listeners.forEach((listener) =>
        listener({ matches: true } as MediaQueryListEvent),
      );
    });

    expect(screen.getByTestId("resolved-theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(startViewTransitionMock).toHaveBeenCalledTimes(1);

    // Simulate OS switching back to light mode -> triggers radial transition
    act(() => {
      matchesDark = false;
      listeners.forEach((listener) =>
        listener({ matches: false } as MediaQueryListEvent),
      );
    });

    expect(screen.getByTestId("resolved-theme").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(startViewTransitionMock).toHaveBeenCalledTimes(2);
  });

  it("renders ThemeSwitcher with 3 accessible options and handles clicks", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    const switcher = screen.getByTestId("theme-switcher");
    expect(switcher).toBeInTheDocument();
    expect(switcher).toHaveAttribute("role", "radiogroup");

    const systemBtn = screen.getByTestId("theme-option-system");
    const lightBtn = screen.getByTestId("theme-option-light");
    const darkBtn = screen.getByTestId("theme-option-dark");

    expect(systemBtn).toBeInTheDocument();
    expect(lightBtn).toBeInTheDocument();
    expect(darkBtn).toBeInTheDocument();

    // Default active is system
    expect(systemBtn).toHaveAttribute("aria-checked", "true");
    expect(lightBtn).toHaveAttribute("aria-checked", "false");
    expect(darkBtn).toHaveAttribute("aria-checked", "false");

    // Click dark
    act(() => {
      fireEvent.click(darkBtn);
    });

    expect(darkBtn).toHaveAttribute("aria-checked", "true");
    expect(systemBtn).toHaveAttribute("aria-checked", "false");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    // Click light
    act(() => {
      fireEvent.click(lightBtn);
    });

    expect(lightBtn).toHaveAttribute("aria-checked", "true");
    expect(darkBtn).toHaveAttribute("aria-checked", "false");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("renders ThemeDropdown as a cyclic icon-only circular button (System -> Light -> Dark -> System) with left chat-bubble tooltip, right-pointing tail, and no dropdown", () => {
    render(
      <ThemeProvider>
        <ThemeDropdown />
      </ThemeProvider>,
    );

    const toggleBtn = screen.getByTestId("theme-switcher-dropdown");
    expect(toggleBtn).toBeInTheDocument();
    // Strictly icon-only: no visible text inside the button, no aria-haspopup
    expect(toggleBtn).toHaveTextContent("");
    expect(toggleBtn).toHaveClass("rounded-full");
    expect(toggleBtn).not.toHaveAttribute("aria-haspopup");
    expect(screen.getByTestId("theme-toggle-icon-system")).toBeInTheDocument();

    // Tooltip is positioned to the left (right-full) with a right-pointing triangular tail
    const tooltip = screen.getByTestId("theme-toggle-tooltip");
    const tail = screen.getByTestId("theme-tooltip-tail");
    expect(tooltip).toHaveClass("right-full");
    expect(tail).toBeInTheDocument();
    expect(tail).toHaveClass("-right-[5px]");
    expect(tail).toHaveClass("border-l-foreground");
    expect(tooltip).toHaveTextContent("System Mode");
    expect(tooltip).toHaveAttribute("data-visible", "false");

    // Hover & focus show tooltip
    fireEvent.mouseEnter(toggleBtn);
    expect(tooltip).toHaveAttribute("data-visible", "true");

    fireEvent.mouseLeave(toggleBtn);
    expect(tooltip).toHaveAttribute("data-visible", "false");

    fireEvent.focus(toggleBtn);
    expect(tooltip).toHaveAttribute("data-visible", "true");
    fireEvent.blur(toggleBtn);
    expect(tooltip).toHaveAttribute("data-visible", "false");

    // Click 1: System -> Light (no dropdown opens, immediately updates icon & tooltip)
    fireEvent.click(toggleBtn);
    expect(screen.queryByTestId("theme-dropdown-menu")).not.toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("data-theme-mode", "light");
    expect(toggleBtn).toHaveAttribute("data-next-theme-mode", "dark");
    expect(screen.getByTestId("theme-toggle-icon-light")).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Light Mode");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    // Click 2: Light -> Dark
    fireEvent.click(toggleBtn);
    expect(screen.queryByTestId("theme-dropdown-menu")).not.toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("data-theme-mode", "dark");
    expect(toggleBtn).toHaveAttribute("data-next-theme-mode", "system");
    expect(screen.getByTestId("theme-toggle-icon-dark")).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Dark Mode");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    // Click 3: Dark -> System
    fireEvent.click(toggleBtn);
    expect(screen.queryByTestId("theme-dropdown-menu")).not.toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("data-theme-mode", "system");
    expect(toggleBtn).toHaveAttribute("data-next-theme-mode", "light");
    expect(screen.getByTestId("theme-toggle-icon-system")).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("System Mode");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");

    // Verify vertical Dynamic Island container & bottom Language toggle (🇬🇧 <-> 🇮🇩)
    const island = screen.getByTestId("floating-theme-language-island");
    expect(island).toHaveClass("flex-col");
    expect(island).toHaveClass("rounded-full");

    const langBtn = screen.getByTestId("language-switcher-button");
    const langTooltip = screen.getByTestId("language-toggle-tooltip");
    const langTail = screen.getByTestId("language-tooltip-tail");

    expect(langBtn).toHaveAttribute("data-language", "en");
    expect(screen.getByTestId("language-flag-en")).toHaveTextContent("🇬🇧");
    expect(langTooltip).toHaveClass("right-full");
    expect(langTail).toHaveClass("-right-[5px]");
    expect(langTail).toHaveClass("border-l-foreground");
    expect(langTooltip).toHaveTextContent("English");
    expect(langTooltip).toHaveAttribute("data-visible", "false");

    // Hover & focus on language button show only language tooltip, not theme tooltip
    fireEvent.mouseEnter(langBtn);
    expect(langTooltip).toHaveAttribute("data-visible", "true");
    expect(tooltip).toHaveAttribute("data-visible", "false");
    fireEvent.mouseLeave(langBtn);
    expect(langTooltip).toHaveAttribute("data-visible", "false");

    // Click language button: switches English (🇬🇧) -> Bahasa Indonesia (🇮🇩) without resetting theme
    fireEvent.click(langBtn);
    expect(langBtn).toHaveAttribute("data-language", "id");
    expect(screen.getByTestId("language-flag-id")).toHaveTextContent("🇮🇩");
    expect(langTooltip).toHaveTextContent("Bahasa Indonesia");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("id");
    expect(document.documentElement.lang).toBe("id");
    expect(toggleBtn).toHaveAttribute("data-theme-mode", "system");

    // Click language button again: switches Bahasa Indonesia (🇮🇩) -> English (🇬🇧)
    fireEvent.click(langBtn);
    expect(langBtn).toHaveAttribute("data-language", "en");
    expect(screen.getByTestId("language-flag-en")).toHaveTextContent("🇬🇧");
    expect(langTooltip).toHaveTextContent("English");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });

  it("runs radial transition ONLY when effective resolvedTheme changes (handles all System/Light/Dark combinations)", () => {
    const startViewTransitionMock = vi.fn((cb: () => void) => {
      cb();
      return {
        ready: Promise.resolve(),
        finished: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      };
    });
    (document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    // Start with OS preferring Light (default matchesDark = false)
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("current-theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved-theme").textContent).toBe("light");
    expect(startViewTransitionMock).toHaveBeenCalledTimes(0);

    // 1. System (OS Light) -> Light: effective stays "light" -> NO transition!
    act(() => {
      fireEvent.click(screen.getByTestId("set-light"));
    });
    expect(screen.getByTestId("current-theme").textContent).toBe("light");
    expect(startViewTransitionMock).toHaveBeenCalledTimes(0);

    // 2. Light -> System (OS Light): effective stays "light" -> NO transition!
    act(() => {
      fireEvent.click(screen.getByTestId("set-system"));
    });
    expect(screen.getByTestId("current-theme").textContent).toBe("system");
    expect(startViewTransitionMock).toHaveBeenCalledTimes(0);

    // 3. System (OS Light) -> Dark: effective changes light -> dark -> ANIMATE (count = 1)
    act(() => {
      fireEvent.click(screen.getByTestId("set-dark"));
    });
    expect(screen.getByTestId("resolved-theme").textContent).toBe("dark");
    expect(startViewTransitionMock).toHaveBeenCalledTimes(1);

    // 4. Dark -> System (when OS prefers Light): effective changes dark -> light -> ANIMATE (count = 2)
    act(() => {
      fireEvent.click(screen.getByTestId("set-system"));
    });
    expect(screen.getByTestId("resolved-theme").textContent).toBe("light");
    expect(startViewTransitionMock).toHaveBeenCalledTimes(2);

    // 5. Switch to Dark (count = 3), then set OS to Dark, then switch Dark -> System (OS Dark): effective stays dark -> NO transition!
    act(() => {
      fireEvent.click(screen.getByTestId("set-dark"));
    });
    expect(startViewTransitionMock).toHaveBeenCalledTimes(3);

    matchesDark = true;
    act(() => {
      fireEvent.click(screen.getByTestId("set-system"));
    });
    expect(screen.getByTestId("current-theme").textContent).toBe("system");
    expect(screen.getByTestId("resolved-theme").textContent).toBe("dark");
    expect(startViewTransitionMock).toHaveBeenCalledTimes(3); // Unchanged!

    // 6. System (OS Dark) -> Light (count = 4), then Light -> System (when OS prefers Dark): effective changes light -> dark -> ANIMATE (count = 5)
    act(() => {
      fireEvent.click(screen.getByTestId("set-light"));
    });
    expect(startViewTransitionMock).toHaveBeenCalledTimes(4);

    act(() => {
      fireEvent.click(screen.getByTestId("set-system"));
    });
    expect(screen.getByTestId("resolved-theme").textContent).toBe("dark");
    expect(startViewTransitionMock).toHaveBeenCalledTimes(5);
  });

  it("calculates radial reveal geometry from the toggle element center to the farthest viewport corner and respects prefers-reduced-motion", () => {
    Object.defineProperty(window, "innerWidth", { value: 1440, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });

    const fakeButton = {
      getBoundingClientRect: () => ({
        left: 1380,
        top: 24,
        width: 36,
        height: 36,
      }),
    } as unknown as HTMLElement;

    const geo = calculateRadialRevealGeometry(fakeButton);
    expect(geo.x).toBe(1398);
    expect(geo.y).toBe(42);
    // Farthest corner is bottom-left: hypot(1398, 900 - 42) = hypot(1398, 858) = ceil(1640.29) = 1641
    expect(geo.maxRadius).toBe(Math.ceil(Math.hypot(1398, 858)));

    // When prefers-reduced-motion is true, startViewTransition is NOT invoked
    prefersReducedMotion = true;
    const startViewTransitionMock = vi.fn();
    (document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByTestId("set-dark"));
    });

    expect(screen.getByTestId("resolved-theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(startViewTransitionMock).not.toHaveBeenCalled();
  });

  it("cancels in-flight transition cleanly on rapid repeated clicks and provides fallback overlay when View Transition API is unavailable", () => {
    vi.useFakeTimers();
    const skipTransitionSpy = vi.fn();
    let resolveFinished: (() => void) | null = null;

    const startViewTransitionMock = vi.fn((cb: () => void) => {
      cb();
      return {
        ready: Promise.resolve(),
        finished: new Promise<void>((res) => {
          resolveFinished = res;
        }),
        updateCallbackDone: Promise.resolve(),
        skipTransition: skipTransitionSpy,
      };
    });
    (document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    // Click 1: Light -> Dark
    act(() => {
      fireEvent.click(screen.getByTestId("set-dark"));
    });
    expect(startViewTransitionMock).toHaveBeenCalledTimes(1);
    expect(skipTransitionSpy).toHaveBeenCalledTimes(0);

    // Rapid Click 2 before Click 1 finished: Dark -> Light -> cancels Click 1 via skipTransition
    act(() => {
      fireEvent.click(screen.getByTestId("set-light"));
    });
    expect(skipTransitionSpy).toHaveBeenCalledTimes(1);
    expect(startViewTransitionMock).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("resolved-theme").textContent).toBe("light");

    if (resolveFinished) (resolveFinished as () => void)();

    // Now test fallback when startViewTransition is unavailable
    delete (document as { startViewTransition?: unknown }).startViewTransition;

    act(() => {
      fireEvent.click(screen.getByTestId("set-dark"));
    });
    expect(screen.getByTestId("resolved-theme").textContent).toBe("dark");
    expect(screen.getByTestId("theme-radial-fallback")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.queryByTestId("theme-radial-fallback")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  describe("Separate Floating Resume Download Button", () => {
    const mockActiveResume: ActiveResume = {
      id: "test-resume-1",
      versionLabel: "v2026.1",
      fileName: "Muhamad-Fauzan-Resume.pdf",
      fileUrl: "/api/resume/download/test-resume-1",
      updatedAt: "2026-11-06T00:00:00.000Z",
      summaryNote: "Software Engineer resume",
      status: "published",
    };

    it("renders separate circular floating resume button directly below Dynamic Island when activeResume is configured", () => {
      render(
        <ThemeProvider>
          <ThemeDropdown activeResume={mockActiveResume} />
        </ThemeProvider>,
      );

      // 1. Dynamic Island container exists with its 2 controls
      const island = screen.getByTestId("floating-theme-language-island");
      expect(island).toBeInTheDocument();
      expect(screen.getByTestId("theme-switcher-dropdown")).toBeInTheDocument();
      expect(screen.getByTestId("language-switcher-button")).toBeInTheDocument();

      // 2. Resume button is OUTSIDE the Dynamic Island container
      const resumeBtn = screen.getByTestId("floating-resume-download-button");
      expect(resumeBtn).toBeInTheDocument();
      expect(island).not.toContainElement(resumeBtn);

      // 3. Perfectly circular, icon only, no visible text
      expect(resumeBtn).toHaveClass("rounded-full");
      expect(resumeBtn).toHaveTextContent("");
      expect(resumeBtn.querySelector("svg")).toBeInTheDocument();

      // 4. Inverted high-contrast styling (bg-foreground text-background)
      expect(resumeBtn).toHaveClass("bg-foreground");
      expect(resumeBtn).toHaveClass("text-background");

      // 5. Download link points to secure route with download parameter and attribute
      expect(resumeBtn).toHaveAttribute(
        "href",
        "/api/resume/download/test-resume-1?download=true",
      );
      expect(resumeBtn).toHaveAttribute("download", "Muhamad-Fauzan-Resume.pdf");
    });

    it("displays localized chat-bubble tooltip on the left with right-pointing tail for Resume button", () => {
      render(
        <ThemeProvider>
          <ThemeDropdown activeResume={mockActiveResume} />
        </ThemeProvider>,
      );

      const resumeBtn = screen.getByTestId("floating-resume-download-button");
      const tooltip = screen.getByTestId("resume-download-tooltip");
      const tail = screen.getByTestId("resume-tooltip-tail");

      // Initially hidden
      expect(tooltip).toHaveAttribute("data-visible", "false");
      expect(tooltip).toHaveClass("right-full"); // Left of the button
      expect(tail).toHaveClass("-right-[5px]");
      expect(tail).toHaveClass("border-l-foreground"); // Points right towards button

      // English label
      expect(tooltip).toHaveTextContent("Download Resume");

      // Hover shows tooltip
      fireEvent.mouseEnter(resumeBtn);
      expect(tooltip).toHaveAttribute("data-visible", "true");

      fireEvent.mouseLeave(resumeBtn);
      expect(tooltip).toHaveAttribute("data-visible", "false");

      // Focus shows tooltip
      fireEvent.focus(resumeBtn);
      expect(tooltip).toHaveAttribute("data-visible", "true");

      fireEvent.blur(resumeBtn);
      expect(tooltip).toHaveAttribute("data-visible", "false");
    });

    it("displays Indonesian tooltip text 'Unduh Resume' when active language is id", () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, "id");
      render(
        <ThemeProvider>
          <ThemeDropdown activeResume={mockActiveResume} />
        </ThemeProvider>,
      );

      const tooltip = screen.getByTestId("resume-download-tooltip");
      expect(tooltip).toHaveTextContent("Unduh Resume");
    });

    it("gracefully hides the resume button when activeResume is null (no published resume configured)", () => {
      render(
        <ThemeProvider>
          <ThemeDropdown activeResume={null} />
        </ThemeProvider>,
      );

      // Dynamic Island remains functional
      expect(screen.getByTestId("floating-theme-language-island")).toBeInTheDocument();
      expect(screen.getByTestId("theme-switcher-dropdown")).toBeInTheDocument();
      expect(screen.getByTestId("language-switcher-button")).toBeInTheDocument();

      // Resume button and tooltip are gracefully omitted
      expect(
        screen.queryByTestId("floating-resume-download-button"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("resume-download-tooltip"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Global Theme-Aware Text Selection", () => {
    it("defines global ::selection and ::-moz-selection styles bound to theme variables", () => {
      const globalsCssPath = path.resolve(process.cwd(), "src/app/globals.css");
      const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

      expect(globalsCss).toContain("::selection");
      expect(globalsCss).toContain("::-moz-selection");
      expect(globalsCss).toContain("background-color: var(--text-primary);");
      expect(globalsCss).toContain("color: var(--bg-primary);");
    });

    it("evaluates inverted selection colors with high contrast in Light Mode", () => {
      const globalsCssPath = path.resolve(process.cwd(), "src/app/globals.css");
      const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

      // In Light Mode (:root / .light):
      // --bg-primary is #ffffff, --text-primary is #171a21
      // Selection background is dark (#171a21), selected text is light (#ffffff)
      expect(globalsCss).toMatch(/:root\s*\{[^}]*--bg-primary:\s*#ffffff;/);
      expect(globalsCss).toMatch(/:root\s*\{[^}]*--text-primary:\s*#171a21;/);
    });

    it("evaluates inverted selection colors with high contrast in Dark Mode", () => {
      const globalsCssPath = path.resolve(process.cwd(), "src/app/globals.css");
      const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

      // In Dark Mode (.dark / prefers-color-scheme: dark):
      // --bg-primary is #090d16, --text-primary is #f8fafc
      // Selection background is light (#f8fafc), selected text is dark (#090d16)
      expect(globalsCss).toMatch(/\.dark\s*\{[^}]*--bg-primary:\s*#090d16;/);
      expect(globalsCss).toMatch(/\.dark\s*\{[^}]*--text-primary:\s*#f8fafc;/);
    });

    it("verifies public Home Deck and Hero enable text selection", () => {
      const deckPath = path.resolve(
        process.cwd(),
        "src/components/public/home-fullscreen-deck.tsx",
      );
      const deckContent = fs.readFileSync(deckPath, "utf-8");
      expect(deckContent).toContain("select-text");

      const sectionsPath = path.resolve(
        process.cwd(),
        "src/components/public/home-sections.tsx",
      );
      const sectionsContent = fs.readFileSync(sectionsPath, "utf-8");
      expect(sectionsContent).toContain('id="hero"');
      expect(sectionsContent).toMatch(/id="hero"[\s\S]*?select-text/);
    });
  });
});
