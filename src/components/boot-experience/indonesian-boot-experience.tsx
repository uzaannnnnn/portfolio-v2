"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { BootGreeting, BootWelcomeConfig, HandwritingFontId } from "@/types/portfolio";
import type * as opentype from "opentype.js";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/theme/theme-provider";
import { pickLocalizedText } from "@/lib/i18n/localization";
import {
  preloadAllHandwritingFonts,
  getOrLoadHandwritingFont,
  getCachedHandwritingFonts,
  selectControlledRandomFont,
  getGlyphPaths,
  getGreetingOriginLabel,
  DEFAULT_HANDWRITING_FONT_ID,
} from "@/lib/boot/handwriting-font";
import { HandwritingGreeting } from "./handwriting-greeting";

export const BOOT_EXPERIENCE_STORAGE_KEY = "mf_portfolio_boot_seen_v1";
export const BOOT_EXPERIENCE_REPLAY_EVENT = "mf:portfolio:replay-boot";

// In-memory session tracking: resets on full browser refresh, survives internal SPA navigation
let hasCompletedBootInSession = false;

/**
 * Resets the in-memory session flag (primarily for test suites or programmatic re-runs).
 */
export function resetBootExperienceSession(): void {
  hasCompletedBootInSession = false;
}

interface BootExperienceContextValue {
  replayBootExperience: () => void;
  isBootEnabled: boolean;
  isBootOpen: boolean;
}

const BootExperienceContext = React.createContext<BootExperienceContextValue>({
  replayBootExperience: () => undefined,
  isBootEnabled: true,
  isBootOpen: false,
});

export function useBootExperience() {
  return React.useContext(BootExperienceContext);
}

export interface IndonesianBootExperienceProps {
  greetings: BootGreeting[];
  config: BootWelcomeConfig;
  children: React.ReactNode;
}

export function IndonesianBootExperience({
  greetings,
  config,
  children,
}: IndonesianBootExperienceProps) {
  const prefersReducedMotion = useReducedMotion();
  const [loadedFonts, setLoadedFonts] = React.useState<Map<HandwritingFontId, opentype.Font>>(
    () => new Map(getCachedHandwritingFonts()),
  );
  const loadedFontsRef = React.useRef(loadedFonts);
  loadedFontsRef.current = loadedFonts;

  const activeGreetings = React.useMemo(
    () =>
      greetings
        .filter((g) => g.isEnabled && g.status === "published")
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [greetings],
  );

  // Synchronous initial state: ensures booting overlay is rendered on frame 0
  // and Home content is never flashed before booting begins on page load/refresh.
  const shouldBootInitially = Boolean(
    config.enabled && activeGreetings.length > 0 && !hasCompletedBootInSession,
  );

  const [isOpen, setIsOpen] = React.useState<boolean>(shouldBootInitially);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [currentFontId, setCurrentFontId] = React.useState<HandwritingFontId>(
    DEFAULT_HANDWRITING_FONT_ID,
  );
  const prevFontIdRef = React.useRef<HandwritingFontId | undefined>(undefined);
  const isClosingRef = React.useRef(false);

  // Preload all 6 handwriting fonts in parallel on client mount
  React.useEffect(() => {
    let active = true;
    preloadAllHandwritingFonts().then((map) => {
      if (active && map.size > 0) {
        setLoadedFonts(new Map(map));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Safe dismiss handler: single-fire, prevents race conditions, marks session complete
  const dismissBootExperience = React.useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    hasCompletedBootInSession = true;
    setIsOpen(false);
  }, []);

  const replayBootExperience = React.useCallback(() => {
    if (!config.enabled || activeGreetings.length === 0) return;
    isClosingRef.current = false;
    setCurrentIndex(0);
    prevFontIdRef.current = undefined;
    setIsOpen(true);
  }, [activeGreetings.length, config.enabled]);

  // Purge any legacy persisted flag and ensure state consistency on refresh
  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(BOOT_EXPERIENCE_STORAGE_KEY);
      }
    } catch {
      // Safe ignore
    }

    if (!config.enabled || activeGreetings.length === 0) {
      if (isOpen) {
        setIsOpen(false);
      }
      return;
    }

    if (!hasCompletedBootInSession && !isOpen) {
      setCurrentIndex(0);
      prevFontIdRef.current = undefined;
      isClosingRef.current = false;
      setIsOpen(true);
    }
  }, [activeGreetings.length, config.enabled, isOpen]);

  // Listen to custom replay event
  React.useEffect(() => {
    const handleReplay = () => replayBootExperience();
    window.addEventListener(BOOT_EXPERIENCE_REPLAY_EVENT, handleReplay);
    return () => window.removeEventListener(BOOT_EXPERIENCE_REPLAY_EVENT, handleReplay);
  }, [replayBootExperience]);

  const currentGreeting = activeGreetings[currentIndex];

  // Assign controlled randomized font per greeting without back-to-back repetitions
  React.useEffect(() => {
    if (!currentGreeting) return;

    const nextFontId = selectControlledRandomFont(
      currentGreeting.greeting,
      prevFontIdRef.current,
      loadedFontsRef.current,
    );

    prevFontIdRef.current = nextFontId;
    setCurrentFontId(nextFontId);

    // Ensure the specific chosen font is ready
    if (!loadedFontsRef.current.has(nextFontId)) {
      getOrLoadHandwritingFont(nextFontId).then((f) => {
        if (f) {
          setLoadedFonts((prev) => {
            if (prev.get(nextFontId) === f) return prev;
            const next = new Map(prev);
            next.set(nextFontId, f);
            return next;
          });
        }
      });
    }
  }, [currentGreeting]);

  const activeFont = loadedFonts.get(currentFontId) ?? null;

  // Pre-calculate vector path layout for the active greeting with the randomized font
  const layout = React.useMemo(() => {
    if (!activeFont || !currentGreeting) return null;
    return getGlyphPaths(activeFont, currentGreeting.greeting);
  }, [activeFont, currentGreeting]);

  // Advance through regional greetings on interval
  React.useEffect(() => {
    if (!isOpen) return;
    if (activeGreetings.length === 0) {
      dismissBootExperience();
      return;
    }

    const drawTimeSeconds = layout ? layout.totalDrawTime : 0.8;
    const holdTimeSeconds = 1.35; // Pause to admire the handwriting
    const naturalIntervalMs = Math.round((drawTimeSeconds + holdTimeSeconds) * 1000);

    const intervalDuration = prefersReducedMotion
      ? Math.min(config.intervalMs, 900)
      : Math.max(naturalIntervalMs, config.intervalMs);

    const timer = window.setTimeout(() => {
      if (currentIndex + 1 < activeGreetings.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        dismissBootExperience();
      }
    }, intervalDuration);

    return () => window.clearTimeout(timer);
  }, [
    activeGreetings.length,
    config.intervalMs,
    currentIndex,
    dismissBootExperience,
    isOpen,
    layout,
    prefersReducedMotion,
  ]);

  // Keyboard support: Escape, Enter, or Space exits immediately
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        dismissBootExperience();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissBootExperience, isOpen]);

  const { language } = useLanguage();
  const originLabel = currentGreeting ? getGreetingOriginLabel(currentGreeting, language) : "";
  const localizedMeaning = currentGreeting
    ? pickLocalizedText(language, currentGreeting.meaning, currentGreeting.meaningId)
    : "";

  return (
    <BootExperienceContext.Provider
      value={{
        replayBootExperience,
        isBootEnabled: config.enabled,
        isBootOpen: isOpen,
      }}
    >
      {/* Home / public content boundary: completely hidden while booting is active */}
      <div
        data-testid="boot-experience-content-wrapper"
        className={cn(
          "h-full w-full",
          isOpen
            ? "invisible opacity-0 pointer-events-none"
            : "visible opacity-100 transition-opacity duration-300",
        )}
        aria-hidden={isOpen}
      >
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Indonesian regional welcome experience. Click anywhere or press Escape to enter"
            data-testid="boot-experience-overlay"
            onClick={dismissBootExperience}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                dismissBootExperience();
              }
            }}
            tabIndex={0}
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.35 }}
            className="fixed inset-0 z-[100] flex cursor-pointer select-none items-center justify-center bg-background p-4 sm:p-6 text-foreground overflow-visible"
          >
            <AnimatePresence mode="wait">
              {currentGreeting && (
                <motion.div
                  key={currentGreeting.id}
                  data-testid="boot-greeting-stage"
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.1 : 0.42,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center space-y-3 md:space-y-4 px-2 sm:px-4 overflow-visible"
                  aria-live="polite"
                  aria-label={`${currentGreeting.greeting} (${originLabel})`}
                >
                  {/* A. GREETING ORIGIN LABEL (PRESERVED IDENTITY - HIGH CONTRAST) */}
                  <motion.p
                    data-testid="boot-origin-label"
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: prefersReducedMotion ? 0.05 : 0.32,
                      ease: "easeOut",
                    }}
                    className="font-mono text-xs md:text-sm font-medium tracking-[0.22em] text-[#000000] dark:text-[#ffffff] uppercase select-none"
                  >
                    {originLabel}
                  </motion.p>

                  <span className="sr-only">
                    {currentGreeting.greeting} ({originLabel} - {localizedMeaning})
                  </span>

                  {/* B. HANDWRITTEN GREETING WITH RANDOMIZED FONT */}
                  <HandwritingGreeting
                    text={currentGreeting.greeting}
                    layout={layout}
                    fontId={currentFontId}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </BootExperienceContext.Provider>
  );
}
