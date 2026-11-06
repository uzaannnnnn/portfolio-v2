"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Globe, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BootGreeting, BootWelcomeConfig } from "@/types/portfolio";

export const BOOT_EXPERIENCE_STORAGE_KEY = "mf_portfolio_boot_seen_v1";
export const BOOT_EXPERIENCE_REPLAY_EVENT = "mf:portfolio:replay-boot";

interface BootExperienceContextValue {
  replayBootExperience: () => void;
  isBootEnabled: boolean;
}

const BootExperienceContext = React.createContext<BootExperienceContextValue>({
  replayBootExperience: () => undefined,
  isBootEnabled: true,
});

export function useBootExperience() {
  return React.useContext(BootExperienceContext);
}

function readSeenFlag(): boolean {
  try {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(BOOT_EXPERIENCE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSeenFlag(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BOOT_EXPERIENCE_STORAGE_KEY, "1");
  } catch {
    // Safely ignore if localStorage is blocked or unavailable
  }
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
  const activeGreetings = React.useMemo(
    () =>
      greetings
        .filter((g) => g.isEnabled && g.status === "published")
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [greetings],
  );

  const [isOpen, setIsOpen] = React.useState(false);
  const [phase, setPhase] = React.useState<"greetings" | "welcome">("greetings");
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const enterButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const closeAndPersist = React.useCallback(() => {
    writeSeenFlag();
    setIsOpen(false);
  }, []);

  const replayBootExperience = React.useCallback(() => {
    if (!config.enabled) return;
    setCurrentIndex(0);
    setPhase(activeGreetings.length > 0 ? "greetings" : "welcome");
    setIsOpen(true);
  }, [activeGreetings.length, config.enabled]);

  // First-visit check on client mount only (never during SSR)
  React.useEffect(() => {
    if (!config.enabled) return;
    const alreadySeen = readSeenFlag();
    if (!alreadySeen) {
      setCurrentIndex(0);
      setPhase(activeGreetings.length > 0 ? "greetings" : "welcome");
      setIsOpen(true);
    }
  }, [activeGreetings.length, config.enabled]);

  // Listen to custom replay event
  React.useEffect(() => {
    const handleReplay = () => replayBootExperience();
    window.addEventListener(BOOT_EXPERIENCE_REPLAY_EVENT, handleReplay);
    return () => window.removeEventListener(BOOT_EXPERIENCE_REPLAY_EVENT, handleReplay);
  }, [replayBootExperience]);

  // Advance through regional greetings on interval
  React.useEffect(() => {
    if (!isOpen || phase !== "greetings") return;
    if (activeGreetings.length === 0) {
      setPhase("welcome");
      return;
    }

    const intervalDuration = prefersReducedMotion
      ? Math.min(config.intervalMs, 900)
      : Math.max(config.intervalMs, 1500);

    const timer = window.setTimeout(() => {
      if (currentIndex + 1 < activeGreetings.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setPhase("welcome");
      }
    }, intervalDuration);

    return () => window.clearTimeout(timer);
  }, [
    activeGreetings.length,
    config.intervalMs,
    currentIndex,
    isOpen,
    phase,
    prefersReducedMotion,
  ]);

  // Focus primary action when entering welcome screen
  React.useEffect(() => {
    if (isOpen && phase === "welcome") {
      enterButtonRef.current?.focus();
    }
  }, [isOpen, phase]);

  // Keyboard support: Escape skips immediately, Enter enters portfolio
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAndPersist();
      } else if (event.key === "Enter" && phase === "welcome") {
        event.preventDefault();
        closeAndPersist();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeAndPersist, isOpen, phase]);

  const currentGreeting = activeGreetings[currentIndex];

  return (
    <BootExperienceContext.Provider
      value={{
        replayBootExperience,
        isBootEnabled: config.enabled,
      }}
    >
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Indonesian regional welcome experience"
            data-testid="boot-experience-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.35 }}
            className="fixed inset-0 z-50 flex flex-col justify-between bg-background px-6 py-8 text-foreground sm:px-12 sm:py-10"
          >
            {/* Top Bar: Identity indicator & Skip Action */}
            <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <Globe className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>Nusantara Welcome</span>
                {phase === "greetings" && activeGreetings.length > 0 && (
                  <span aria-live="off" className="text-secondary-foreground">
                    ({currentIndex + 1} / {activeGreetings.length})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {phase === "greetings" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPhase("welcome")}
                    data-testid="boot-jump-welcome-button"
                  >
                    Welcome Screen
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeAndPersist}
                  data-testid="boot-skip-button"
                >
                  <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
                  Skip
                </Button>
              </div>
            </div>

            {/* Center Stage */}
            <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col items-center justify-center text-center">
              <AnimatePresence mode="wait">
                {phase === "greetings" && currentGreeting ? (
                  <motion.div
                    key={currentGreeting.id}
                    data-testid="boot-greeting-stage"
                    initial={
                      prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -14 }
                    }
                    transition={{
                      duration: prefersReducedMotion ? 0.1 : 0.42,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="space-y-4"
                    aria-live="polite"
                  >
                    <p className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
                      {currentGreeting.language}
                    </p>
                    <p className="type-hero-heading text-foreground">
                      {currentGreeting.greeting}
                    </p>
                    <p className="type-body text-secondary-foreground">
                      {currentGreeting.meaning}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="personal-welcome-screen"
                    data-testid="boot-welcome-stage"
                    initial={
                      prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: prefersReducedMotion ? 0.1 : 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <p className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
                        {config.welcomeTitle}
                      </p>
                      <h2 className="type-page-heading text-foreground">
                        {config.welcomeName}
                      </h2>
                      <p className="type-body-lg mx-auto max-w-[520px] text-secondary-foreground">
                        {config.welcomeMessage}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <Button
                        ref={enterButtonRef}
                        variant="primary"
                        size="lg"
                        onClick={closeAndPersist}
                        data-testid="boot-enter-portfolio-button"
                      >
                        Enter Portfolio
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>

                      {activeGreetings.length > 0 && (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setCurrentIndex(0);
                            setPhase("greetings");
                          }}
                          data-testid="boot-replay-greetings-button"
                        >
                          <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          Replay Greetings
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Progress & Quick Enter Bar */}
            <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-4 border-t border-border-token pt-5 sm:flex-row">
              <div
                className="flex flex-wrap items-center gap-1.5"
                aria-label="Greeting sequence progress"
              >
                {activeGreetings.map((item, idx) => {
                  const isActive =
                    phase === "greetings" && idx === currentIndex;
                  const isCompleted =
                    phase === "welcome" || idx < currentIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setPhase("greetings");
                      }}
                      aria-label={`Show ${item.language} greeting: ${item.greeting}`}
                      className={`h-1.5 rounded-full transition-all ${
                        isActive
                          ? "w-7 bg-accent"
                          : isCompleted
                            ? "w-3 bg-foreground/40"
                            : "w-3 bg-border-token"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <span className="type-caption hidden text-muted-foreground sm:inline">
                  Press <kbd className="rounded border border-border-token px-1.5 py-0.5 font-mono text-xs">Esc</kbd> to enter immediately
                </span>
                {phase === "greetings" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={closeAndPersist}
                    data-testid="boot-direct-enter-button"
                  >
                    Enter Portfolio
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BootExperienceContext.Provider>
  );
}
