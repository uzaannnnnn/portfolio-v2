"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { useBootExperience } from "@/components/boot-experience/indonesian-boot-experience";
import { useActiveSection, type PublicSectionId } from "@/components/public/active-section-context";
import { cn } from "@/lib/utils";

export const HOME_SECTION_IDS = [
  "hero",
  "me",
  "experience",
  "showcase",
  "certifications",
  "contact",
] as const;

export interface HomeFullScreenDeckProps {
  children: React.ReactNode;
  transitionDurationMs?: number;
}

const WHEEL_INTENT_THRESHOLD = 20;
const WHEEL_GESTURE_GAP_MS = 60;
const WHEEL_REACCEL_MIN_ELAPSED_MS = 80;
const SWIPE_INTENT_THRESHOLD = 36;
const DEFAULT_TRANSITION_DURATION_MS = 550;
const REDUCED_MOTION_DURATION_MS = 0;

export function HomeFullScreenDeck({
  children,
  transitionDurationMs = DEFAULT_TRANSITION_DURATION_MS,
}: HomeFullScreenDeckProps) {
  const prefersReducedMotion = useReducedMotion();
  const { isBootOpen } = useBootExperience();
  const { setActiveSectionId } = useActiveSection();

  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const slides = React.useMemo(() => React.Children.toArray(children), [children]);
  const totalSections = slides.length;

  // 1. Authoritative Current Section State
  const [activeIndex, setActiveIndex] = React.useState<number>(0);
  const activeIndexRef = React.useRef<number>(0);

  // 2. Visual Animation State (tracked independently; never blocks a valid new gesture)
  const [isAnimating, setIsAnimating] = React.useState<boolean>(false);
  const isAnimatingRef = React.useRef<boolean>(false);
  const animationTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // 3. Wheel & Trackpad Gesture State (distinguishes residual momentum from new intentional input)
  const wheelGestureLockedRef = React.useRef<boolean>(false);
  const wheelLockedDirectionRef = React.useRef<1 | -1 | 0>(0);
  const wheelTriggerTimeRef = React.useRef<number>(0);
  const wheelPeakAbsRef = React.useRef<number>(0);
  const wheelMinAfterPeakRef = React.useRef<number>(Infinity);
  const wheelDecayFramesRef = React.useRef<number>(0);
  const wheelHasDecayedRef = React.useRef<boolean>(false);
  const wheelAccumRef = React.useRef<number>(0);
  const lastWheelTimeRef = React.useRef<number>(0);
  const prevAbsDeltaRef = React.useRef<number>(0);
  const wheelSilenceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // 4. Touch Swipe Gesture State
  const touchStartYRef = React.useRef<number | null>(null);
  const touchStartXRef = React.useRef<number | null>(null);
  const touchGestureConsumedRef = React.useRef<boolean>(false);

  const deckRef = React.useRef<HTMLDivElement | null>(null);

  const getEffectiveTransitionMs = React.useCallback(() => {
    const isReduced =
      prefersReducedMotion ||
      (typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    return isReduced ? REDUCED_MOTION_DURATION_MS : transitionDurationMs;
  }, [prefersReducedMotion, transitionDurationMs]);

  const isBootOverlayActive = React.useCallback(() => {
    if (isBootOpen) return true;
    if (typeof document !== "undefined") {
      return Boolean(
        document.querySelector('[data-testid="boot-experience-overlay"]'),
      );
    }
    return false;
  }, [isBootOpen]);

  const resetWheelGestureState = React.useCallback(() => {
    wheelGestureLockedRef.current = false;
    wheelLockedDirectionRef.current = 0;
    wheelTriggerTimeRef.current = 0;
    wheelPeakAbsRef.current = 0;
    wheelMinAfterPeakRef.current = Infinity;
    wheelDecayFramesRef.current = 0;
    wheelHasDecayedRef.current = false;
    wheelAccumRef.current = 0;
    prevAbsDeltaRef.current = 0;
  }, []);

  /**
   * Authoritative section navigation controller.
   * Immediately updates activeIndexRef and triggers smooth CSS transition to targetIndex.
   * Does not impose an artificial animation cooldown on valid new gestures.
   */
  const goToSection = React.useCallback(
    (targetIndex: number): boolean => {
      const clamped = Math.max(0, Math.min(totalSections - 1, targetIndex));
      if (clamped === activeIndexRef.current) {
        return false;
      }

      activeIndexRef.current = clamped;
      wheelAccumRef.current = 0;
      setActiveIndex(clamped);

      const nextSectionId = HOME_SECTION_IDS[clamped] ?? `section-${clamped}`;
      setActiveSectionId(nextSectionId as PublicSectionId);

      const durationMs = getEffectiveTransitionMs();
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }

      if (durationMs > 0) {
        isAnimatingRef.current = true;
        setIsAnimating(true);
        animationTimerRef.current = setTimeout(() => {
          isAnimatingRef.current = false;
          setIsAnimating(false);
        }, durationMs);
      } else {
        isAnimatingRef.current = false;
        setIsAnimating(false);
      }

      return true;
    },
    [getEffectiveTransitionMs, setActiveSectionId, totalSections],
  );

  // Clean up timers on unmount and reset transient gesture deltas on blur/visibility/resize
  React.useEffect(() => {
    const handleResetTransientInput = () => {
      resetWheelGestureState();
      touchStartYRef.current = null;
      touchStartXRef.current = null;
      touchGestureConsumedRef.current = false;
    };

    window.addEventListener("blur", handleResetTransientInput);
    window.addEventListener("resize", handleResetTransientInput);
    document.addEventListener("visibilitychange", handleResetTransientInput);

    return () => {
      window.removeEventListener("blur", handleResetTransientInput);
      window.removeEventListener("resize", handleResetTransientInput);
      document.removeEventListener("visibilitychange", handleResetTransientInput);
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      if (wheelSilenceTimerRef.current) {
        clearTimeout(wheelSilenceTimerRef.current);
      }
    };
  }, [resetWheelGestureState]);

  // Mobile: observe sections for active section ID & floating controls visibility
  React.useEffect(() => {
    if (!isMobile) return;
    if (typeof IntersectionObserver === "undefined") return;
    const sectionIds: PublicSectionId[] = [
      "hero",
      "me",
      "experience",
      "showcase",
      "certifications",
      "contact",
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length > 0) {
          intersecting.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const topEntry = intersecting[0];
          if (topEntry && topEntry.target.id) {
            const id = topEntry.target.id as PublicSectionId;
            setActiveSectionId(id);
            const idx = sectionIds.indexOf(id);
            if (idx >= 0) {
              setActiveIndex(idx);
              activeIndexRef.current = idx;
            }
          }
        }
      },
      {
        root: null,
        threshold: [0.1, 0.25, 0.5, 0.75],
        rootMargin: "-10% 0px -25% 0px",
      },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [isMobile, setActiveSectionId]);

  // 1. Mouse Wheel & Trackpad Gesture State Machine (non-passive to prevent native scroll)
  React.useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (isMobile || isBootOverlayActive()) return;
      if (e.ctrlKey) return; // Allow browser pinch-zoom

      // Ignore primarily horizontal trackpad movement and Shift + mouse wheel
      const isHorizontalDominant = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const isShiftHorizontal = e.shiftKey;

      if (isHorizontalDominant || isShiftHorizontal) {
        // Clear vertical accumulation so horizontal gestures cannot prime a vertical transition
        wheelAccumRef.current = 0;
        return;
      }

      if (e.cancelable) {
        e.preventDefault();
      }

      // Normalize deltaMode (0 = pixels, 1 = lines, 2 = pages)
      const normalizedDeltaY =
        e.deltaMode === 1
          ? e.deltaY * 32
          : e.deltaMode === 2
            ? e.deltaY * 300
            : e.deltaY;
      const absDelta = Math.abs(normalizedDeltaY);
      if (absDelta === 0) {
        return;
      }

      const eventDirection: 1 | -1 = normalizedDeltaY > 0 ? 1 : -1;
      const now = Date.now();
      const dt = lastWheelTimeRef.current > 0 ? now - lastWheelTimeRef.current : Infinity;
      lastWheelTimeRef.current = now;

      // Unlock 1 (Pause / Gesture Boundary): If stream was silent for >= WHEEL_GESTURE_GAP_MS,
      // the previous wheel or trackpad momentum stream has ended.
      if (dt >= WHEEL_GESTURE_GAP_MS) {
        resetWheelGestureState();
      }

      // Schedule automatic state cleanup once wheel stream goes silent
      if (wheelSilenceTimerRef.current) {
        clearTimeout(wheelSilenceTimerRef.current);
      }
      wheelSilenceTimerRef.current = setTimeout(() => {
        resetWheelGestureState();
      }, WHEEL_GESTURE_GAP_MS);

      // If the current gesture has already triggered its 1 allowed section transition:
      if (wheelGestureLockedRef.current) {
        // Unlock 2 (Direction Reversal): Opposite scroll direction is always a new intentional gesture
        const isDirectionReversal =
          eventDirection !== wheelLockedDirectionRef.current;

        let isNewImpulseAfterDecay = false;

        if (!isDirectionReversal) {
          if (!wheelHasDecayedRef.current) {
            if (absDelta >= prevAbsDeltaRef.current) {
              // Still rising to peak of the initial gesture stroke
              wheelPeakAbsRef.current = Math.max(wheelPeakAbsRef.current, absDelta);
              wheelMinAfterPeakRef.current = absDelta;
            } else {
              // Delta started dropping from peak -> entering momentum decay
              wheelDecayFramesRef.current += 1;
              wheelMinAfterPeakRef.current = Math.min(
                wheelMinAfterPeakRef.current,
                absDelta,
              );
              if (
                wheelDecayFramesRef.current >= 2 ||
                absDelta <= wheelPeakAbsRef.current * 0.78
              ) {
                wheelHasDecayedRef.current = true;
              }
            }
          } else {
            // Unlock 3 (Velocity Re-Acceleration During Momentum Decay):
            // Once the first gesture has entered decay, inertial momentum only decreases.
            // A significant upward spike in |deltaY| indicates a fresh user flick/scroll impulse.
            const elapsedSinceTrigger = now - wheelTriggerTimeRef.current;
            if (
              elapsedSinceTrigger >= WHEEL_REACCEL_MIN_ELAPSED_MS &&
              absDelta >= Math.max(WHEEL_INTENT_THRESHOLD, wheelMinAfterPeakRef.current + 8) &&
              absDelta >= wheelMinAfterPeakRef.current * 1.35
            ) {
              isNewImpulseAfterDecay = true;
            } else {
              wheelMinAfterPeakRef.current = Math.min(
                wheelMinAfterPeakRef.current,
                absDelta,
              );
            }
          }
        }

        if (isDirectionReversal || isNewImpulseAfterDecay) {
          resetWheelGestureState();
        } else {
          // Absorb ongoing inertial momentum or same-stroke continuation from current gesture
          prevAbsDeltaRef.current = absDelta;
          wheelAccumRef.current = 0;
          return;
        }
      }

      // Reset accumulator if direction flipped before reaching threshold
      if (
        wheelAccumRef.current !== 0 &&
        Math.sign(wheelAccumRef.current) !== eventDirection
      ) {
        wheelAccumRef.current = 0;
      }

      wheelAccumRef.current += normalizedDeltaY;
      prevAbsDeltaRef.current = absDelta;

      if (Math.abs(wheelAccumRef.current) >= WHEEL_INTENT_THRESHOLD) {
        const direction: 1 | -1 = wheelAccumRef.current > 0 ? 1 : -1;
        wheelAccumRef.current = 0;
        goToSection(activeIndexRef.current + direction);

        // Lock this gesture so its remaining stroke and momentum tail cannot trigger a second jump
        wheelGestureLockedRef.current = true;
        wheelLockedDirectionRef.current = direction;
        wheelTriggerTimeRef.current = now;
        wheelPeakAbsRef.current = absDelta;
        wheelMinAfterPeakRef.current = absDelta;
        wheelDecayFramesRef.current = 0;
        wheelHasDecayedRef.current = false;
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [goToSection, isBootOverlayActive, isMobile, resetWheelGestureState]);

  // 2. Keyboard Navigation (ArrowDown/Up, PageDown/Up, Space/Shift+Space, Home/End)
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isMobile || isBootOverlayActive()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (target && typeof target.tagName === "string") {
        const tag = target.tagName.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          target.isContentEditable
        ) {
          return;
        }
        // Preserve Space activation on focused buttons, links, or menu items
        if (
          e.key === " " &&
          (tag === "button" ||
            tag === "a" ||
            Boolean(
              target.closest('button, a, [role="button"], [role="menuitem"]'),
            ))
        ) {
          return;
        }
      }

      const isNavKey =
        e.key === "ArrowDown" ||
        e.key === "PageDown" ||
        e.key === "ArrowUp" ||
        e.key === "PageUp" ||
        e.key === " " ||
        e.key === "Home" ||
        e.key === "End";

      if (!isNavKey) return;

      e.preventDefault();

      // Prevent key auto-repeat from triggering multiple section transitions on a single press
      if (e.repeat) {
        return;
      }

      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          goToSection(activeIndexRef.current + 1);
          break;
        case "ArrowUp":
        case "PageUp":
          goToSection(activeIndexRef.current - 1);
          break;
        case " ":
          if (e.shiftKey) {
            goToSection(activeIndexRef.current - 1);
          } else {
            goToSection(activeIndexRef.current + 1);
          }
          break;
        case "Home":
          goToSection(0);
          break;
        case "End":
          goToSection(totalSections - 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToSection, isBootOverlayActive, isMobile, totalSections]);

  // 3. Touch Swipe Support (Mobile / Tablet)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isMobile || isBootOverlayActive()) return;
    if (e.touches.length === 1 && e.touches[0]) {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartXRef.current = e.touches[0].clientX;
      touchGestureConsumedRef.current = false;
    } else {
      touchStartYRef.current = null;
      touchStartXRef.current = null;
      touchGestureConsumedRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (
      isMobile ||
      touchGestureConsumedRef.current ||
      touchStartYRef.current === null ||
      touchStartXRef.current === null ||
      !e.touches[0]
    ) {
      return;
    }
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(currentX - touchStartXRef.current);
    const diffY = Math.abs(currentY - touchStartYRef.current);

    // If horizontal touch movement is dominant and intentional (>10px), consume gesture
    // so horizontal project browsing never triggers a vertical section transition
    if (diffX > 10 && diffX >= diffY) {
      touchGestureConsumedRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isMobile || isBootOverlayActive()) return;
    if (
      touchGestureConsumedRef.current ||
      touchStartYRef.current === null ||
      touchStartXRef.current === null ||
      !e.changedTouches[0]
    ) {
      touchStartYRef.current = null;
      touchStartXRef.current = null;
      return;
    }

    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const diffY = touchStartYRef.current - touchEndY;
    const diffX = touchStartXRef.current - touchEndX;

    touchStartYRef.current = null;
    touchStartXRef.current = null;
    touchGestureConsumedRef.current = true;

    if (
      Math.abs(diffY) >= SWIPE_INTENT_THRESHOLD &&
      Math.abs(diffY) > Math.abs(diffX) * 1.2
    ) {
      const direction: 1 | -1 = diffY > 0 ? 1 : -1;
      goToSection(activeIndexRef.current + direction);
    }
  };

  const handleTouchCancel = () => {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    touchGestureConsumedRef.current = true;
  };

  const activeSectionId =
    HOME_SECTION_IDS[activeIndex] ?? `section-${activeIndex}`;

  return (
    <div
      ref={deckRef}
      data-testid="home-continuous-flow"
      data-active-section={activeIndex}
      data-active-section-id={activeSectionId}
      data-animating={isAnimating ? "true" : "false"}
      onTouchStart={isMobile ? undefined : handleTouchStart}
      onTouchMove={isMobile ? undefined : handleTouchMove}
      onTouchEnd={isMobile ? undefined : handleTouchEnd}
      onTouchCancel={isMobile ? undefined : handleTouchCancel}
      className={cn(
        "relative w-full select-text overscroll-y-contain",
        isMobile
          ? "h-auto min-h-[100svh] max-h-none overflow-visible"
          : "h-[100svh] min-h-[100svh] max-h-[100svh] overflow-hidden",
      )}
    >
      <div
        data-testid="home-fullpage-track"
        style={{
          transform: isMobile
            ? "none"
            : `translate3d(0, -${activeIndex * 100}svh, 0)`,
          transition:
            isMobile || prefersReducedMotion
              ? "none"
              : `transform ${transitionDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: isMobile ? "auto" : "transform",
        }}
        className="flex w-full flex-col"
      >
        {slides}
      </div>
    </div>
  );
}
