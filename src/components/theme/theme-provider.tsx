"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";

export type Theme = "system" | "dark" | "light";
export type ResolvedTheme = "dark" | "light";
export type Language = "en" | "id";

export const THEME_STORAGE_KEY = "portfolio_theme";
export const LANGUAGE_STORAGE_KEY = "portfolio_language";

export interface ThemeRippleOrigin {
  x: number;
  y: number;
}

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme, origin?: ThemeRippleOrigin) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  registerToggleElement?: (el: HTMLButtonElement | null) => void;
}

interface ViewTransitionInstance {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (
    updateCallback: () => void | Promise<void>,
  ) => ViewTransitionInstance;
};

interface FallbackRadialState {
  id: number;
  x: number;
  y: number;
  maxRadius: number;
  targetTheme: ResolvedTheme;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function isReducedMotionPreferred(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function applyThemeToDOM(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
  }
}

function applyLanguageToDOM(language: Language) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.lang = language;
  root.setAttribute("data-language", language);
}

/**
 * Calculates the exact radial reveal origin (center of the upper theme toggle button)
 * and the Euclidean distance to the farthest corner of the viewport.
 */
export function calculateRadialRevealGeometry(
  toggleEl: HTMLElement | null,
  explicitOrigin?: ThemeRippleOrigin,
): { x: number; y: number; maxRadius: number } {
  const vw =
    typeof window !== "undefined" && window.innerWidth > 0
      ? window.innerWidth
      : 1280;
  const vh =
    typeof window !== "undefined" && window.innerHeight > 0
      ? window.innerHeight
      : 800;

  // Default origin: upper-right floating toggle area
  let x = Math.max(0, vw - 36);
  let y = 36;

  if (
    explicitOrigin &&
    Number.isFinite(explicitOrigin.x) &&
    Number.isFinite(explicitOrigin.y)
  ) {
    x = explicitOrigin.x;
    y = explicitOrigin.y;
  } else if (toggleEl && typeof toggleEl.getBoundingClientRect === "function") {
    const rect = toggleEl.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0 || rect.left > 0 || rect.top > 0) {
      x = Math.round((rect.left + rect.width / 2) * 100) / 100;
      y = Math.round((rect.top + rect.height / 2) * 100) / 100;
    }
  }

  const maxDx = Math.max(x, vw - x);
  const maxDy = Math.max(y, vh - y);
  const maxRadius = Math.ceil(Math.hypot(maxDx, maxDy));

  return { x, y, maxRadius };
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultLanguage?: Language;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultLanguage = "en",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("light");
  const [language, setLanguageState] = React.useState<Language>(defaultLanguage);
  const [mounted, setMounted] = React.useState(false);
  const [fallbackRadial, setFallbackRadial] = React.useState<FallbackRadialState | null>(
    null,
  );

  const resolvedThemeRef = React.useRef<ResolvedTheme>("light");
  const toggleElementRef = React.useRef<HTMLButtonElement | null>(null);
  const activeTransitionRef = React.useRef<ViewTransitionInstance | null>(null);
  const pendingCommitRef = React.useRef<(() => void) | null>(null);
  const fallbackTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionCounterRef = React.useRef<number>(0);

  const registerToggleElement = React.useCallback((el: HTMLButtonElement | null) => {
    toggleElementRef.current = el;
  }, []);

  const clearTransitionArtifacts = React.useCallback(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("theme-transitioning");
      root.removeAttribute("data-theme-transition");
    }
  }, []);

  const cancelActiveTransition = React.useCallback(() => {
    if (pendingCommitRef.current) {
      const commit = pendingCommitRef.current;
      pendingCommitRef.current = null;
      commit();
    }
    if (activeTransitionRef.current) {
      try {
        activeTransitionRef.current.skipTransition();
      } catch {
        // Ignore if already finished
      }
      activeTransitionRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setFallbackRadial(null);
    clearTransitionArtifacts();
  }, [clearTransitionArtifacts]);

  const executeEffectiveThemeChange = React.useCallback(
    (nextResolved: ResolvedTheme, explicitOrigin?: ThemeRippleOrigin) => {
      // Do NOT play any animation if the effective rendered theme does not change
      if (nextResolved === resolvedThemeRef.current) {
        setResolvedTheme(nextResolved);
        applyThemeToDOM(nextResolved);
        return;
      }

      // Cancel any in-flight transition so rapid repeated clicks never overlap
      cancelActiveTransition();
      resolvedThemeRef.current = nextResolved;

      // Respect prefers-reduced-motion: switch immediately without radial animation
      if (isReducedMotionPreferred() || typeof document === "undefined") {
        setResolvedTheme(nextResolved);
        applyThemeToDOM(nextResolved);
        return;
      }

      const { x, y, maxRadius } = calculateRadialRevealGeometry(
        toggleElementRef.current,
        explicitOrigin,
      );
      const root = document.documentElement;
      root.style.setProperty("--theme-ripple-x", `${x}px`);
      root.style.setProperty("--theme-ripple-y", `${y}px`);
      root.style.setProperty("--theme-ripple-r", `${maxRadius}px`);

      const doc = document as DocumentWithViewTransition;

      if (typeof doc.startViewTransition === "function") {
        root.classList.add("theme-transitioning");
        root.setAttribute("data-theme-transition", "view-transition");

        let committed = false;
        const commitDom = () => {
          if (committed) return;
          committed = true;
          pendingCommitRef.current = null;
          try {
            ReactDOM.flushSync(() => {
              setResolvedTheme(nextResolved);
            });
          } catch {
            setResolvedTheme(nextResolved);
          }
          applyThemeToDOM(nextResolved);
        };

        pendingCommitRef.current = commitDom;

        try {
          const transition = doc.startViewTransition(() => {
            commitDom();
          });
          activeTransitionRef.current = transition;

          Promise.resolve(transition.finished)
            .catch(() => {
              commitDom();
            })
            .finally(() => {
              commitDom();
              if (activeTransitionRef.current === transition) {
                activeTransitionRef.current = null;
                clearTransitionArtifacts();
              }
            });
          return;
        } catch {
          commitDom();
          clearTransitionArtifacts();
          return;
        }
      }

      // Fallback when View Transition API is unavailable:
      // Immediately commit state & DOM, and run non-blocking CSS radial overlay
      setResolvedTheme(nextResolved);
      applyThemeToDOM(nextResolved);

      root.classList.add("theme-transitioning");
      root.setAttribute("data-theme-transition", "fallback");

      const nextId = ++transitionCounterRef.current;
      setFallbackRadial({
        id: nextId,
        x,
        y,
        maxRadius,
        targetTheme: nextResolved,
      });

      fallbackTimerRef.current = setTimeout(() => {
        fallbackTimerRef.current = null;
        setFallbackRadial((prev) => (prev?.id === nextId ? null : prev));
        clearTransitionArtifacts();
      }, 520);
    },
    [cancelActiveTransition, clearTransitionArtifacts],
  );

  // Initialize theme and language from localStorage or defaults on mount (no transition on init)
  React.useEffect(() => {
    let savedTheme: Theme = defaultTheme;
    let savedLanguage: Language = defaultLanguage;
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (
        storedTheme === "system" ||
        storedTheme === "dark" ||
        storedTheme === "light"
      ) {
        savedTheme = storedTheme;
      }
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLang === "en" || storedLang === "id") {
        savedLanguage = storedLang;
      }
    } catch {
      // Safe fallback on restricted storage
    }

    const currentSystem = getSystemTheme();
    const resolved = savedTheme === "system" ? currentSystem : savedTheme;

    resolvedThemeRef.current = resolved;
    setThemeState(savedTheme);
    setResolvedTheme(resolved);
    setLanguageState(savedLanguage);
    applyThemeToDOM(resolved);
    applyLanguageToDOM(savedLanguage);
    setMounted(true);

    return () => {
      cancelActiveTransition();
    };
  }, [cancelActiveTransition, defaultLanguage, defaultTheme]);

  // Listen to OS prefers-color-scheme updates when mode is "system"
  React.useEffect(() => {
    if (
      !mounted ||
      theme !== "system" ||
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved: ResolvedTheme = e.matches ? "dark" : "light";
      executeEffectiveThemeChange(newResolved);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mounted, theme, executeEffectiveThemeChange]);

  const setTheme = React.useCallback(
    (nextTheme: Theme, origin?: ThemeRippleOrigin) => {
      setThemeState(nextTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Safe fallback
      }

      const nextResolved: ResolvedTheme =
        nextTheme === "system" ? getSystemTheme() : nextTheme;
      executeEffectiveThemeChange(nextResolved, origin);
    },
    [executeEffectiveThemeChange],
  );

  const setLanguage = React.useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // Safe fallback
    }
    applyLanguageToDOM(nextLanguage);
  }, []);

  const toggleLanguage = React.useCallback(() => {
    setLanguageState((prev) => {
      const next: Language = prev === "en" ? "id" : "en";
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      } catch {
        // Safe fallback
      }
      applyLanguageToDOM(next);
      return next;
    });
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      language,
      setLanguage,
      toggleLanguage,
      registerToggleElement,
    }),
    [
      theme,
      resolvedTheme,
      setTheme,
      language,
      setLanguage,
      toggleLanguage,
      registerToggleElement,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {fallbackRadial && (
        <div
          key={fallbackRadial.id}
          aria-hidden="true"
          data-testid="theme-radial-fallback"
          data-target-theme={fallbackRadial.targetTheme}
          className="theme-radial-fallback-overlay"
          style={{
            backgroundColor:
              fallbackRadial.targetTheme === "dark" ? "#090d16" : "#ffffff",
          }}
        />
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

const DEFAULT_LANGUAGE_FALLBACK = {
  language: "en" as Language,
  setLanguage: () => {},
  toggleLanguage: () => {},
};

/**
 * Safe hook for reading/updating language preference inside or outside ThemeProvider.
 */
export function useLanguage(): {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
} {
  const context = React.useContext(ThemeContext);
  if (!context) {
    return DEFAULT_LANGUAGE_FALLBACK;
  }
  return {
    language: context.language,
    setLanguage: context.setLanguage,
    toggleLanguage: context.toggleLanguage,
  };
}
