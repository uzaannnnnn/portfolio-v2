"use client";

import * as React from "react";
import { useActiveSection } from "@/components/public/active-section-context";
import { ThemeDropdown } from "@/components/theme/theme-switcher";
import type { ActiveResume } from "@/types/portfolio";
import { cn } from "@/lib/utils";

export interface FloatingControlsWrapperProps {
  activeResume?: ActiveResume | null;
}

export function FloatingControlsWrapper({
  activeResume,
}: FloatingControlsWrapperProps) {
  const { isFloatingControlVisible } = useActiveSection();

  return (
    <div
      data-testid="fixed-home-theme-dropdown"
      data-visible={isFloatingControlVisible ? "true" : "false"}
      className={cn(
        "fixed z-50 transition-all duration-300 ease-in-out",
        "top-[max(1.25rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))] sm:top-6 sm:right-8",
        // Desktop: ALWAYS visible and interactive regardless of active section
        "md:opacity-100 md:scale-100 md:pointer-events-auto md:visible",
        isFloatingControlVisible
          ? "opacity-100 scale-100 pointer-events-auto visible"
          : "opacity-0 scale-95 pointer-events-none invisible md:opacity-100 md:scale-100 md:pointer-events-auto md:visible",
      )}
    >
      <ThemeDropdown activeResume={activeResume} />
    </div>
  );
}
