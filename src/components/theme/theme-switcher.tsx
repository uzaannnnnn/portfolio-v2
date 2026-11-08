"use client";

import * as React from "react";
import { FileDown, Monitor, Moon, Sun } from "lucide-react";
import type { ActiveResume } from "@/types/portfolio";
import {
  useTheme,
  type Language,
  type Theme,
  type ThemeRippleOrigin,
} from "./theme-provider";
import { cn } from "@/lib/utils";

export interface ThemeOption {
  value: Theme;
  label: string;
  modeLabel: "System Mode" | "Light Mode" | "Dark Mode";
  icon: typeof Sun;
}

export interface LanguageOption {
  value: Language;
  label: "English" | "Bahasa Indonesia";
  flag: "🇬🇧" | "🇮🇩";
}

/**
 * Exact cyclic order: System -> Light -> Dark -> System ...
 */
export const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: "system", label: "System", modeLabel: "System Mode", icon: Monitor },
  { value: "light", label: "Light", modeLabel: "Light Mode", icon: Sun },
  { value: "dark", label: "Dark", modeLabel: "Dark Mode", icon: Moon },
];

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
];

export function getNextCyclicTheme(current: Theme): Theme {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
}

export function getNextCyclicLanguage(current: Language): Language {
  return current === "en" ? "id" : "en";
}

export interface ThemeSwitcherProps {
  className?: string;
  compact?: boolean;
}

function getElementCenterOrigin(el: HTMLElement | null): ThemeRippleOrigin | undefined {
  if (!el || typeof el.getBoundingClientRect !== "function") return undefined;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0 && rect.left === 0 && rect.top === 0) {
    return undefined;
  }
  return {
    x: Math.round((rect.left + rect.width / 2) * 100) / 100,
    y: Math.round((rect.top + rect.height / 2) * 100) / 100,
  };
}

/**
 * Segmented control theme switcher (used in Admin CMS or compact toolbars).
 */
export function ThemeSwitcher({ className, compact = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? theme : "system";

  return (
    <div
      role="radiogroup"
      aria-label="Theme selection"
      data-testid="theme-switcher"
      className={cn(
        "inline-flex items-center rounded-lg border border-border-token bg-surface p-0.5 text-muted-foreground",
        className,
      )}
    >
      {THEME_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isSelected = activeTheme === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.modeLabel}
            title={opt.modeLabel}
            data-testid={`theme-option-${opt.value}`}
            onClick={(e) => setTheme(opt.value, getElementCenterOrigin(e.currentTarget))}
            className={cn(
              "relative flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent",
              compact ? "h-6.5 w-6.5 text-xs" : "h-7 w-7 text-xs",
              isSelected
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:bg-surface/80 hover:text-foreground",
            )}
          >
            <Icon
              className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

export interface ThemeDropdownProps {
  className?: string;
  activeResume?: ActiveResume | null;
  showResumeButton?: boolean;
  autoFetchActiveResume?: boolean;
}

/**
 * Vertical Dynamic Island-style floating control group:
 * - Dynamic Island container combining:
 *   - TOP: Cyclic Icon-Only Theme Toggle (System -> Light -> Dark -> System)
 *   - BOTTOM: Cyclic Flag-Only Language Toggle (English 🇬🇧 <-> Bahasa Indonesia 🇮🇩)
 * - Separate Floating Circular Resume Download Button directly underneath:
 *   - Inverted contrast (dark filled in light mode, light filled in dark mode)
 *   - Localized chat-bubble tooltip on left (English: "Download Resume", Indonesian: "Unduh Resume")
 *   - Direct file download of published resume
 */
export function ThemeDropdown({
  className,
  activeResume = null,
  showResumeButton = true,
  autoFetchActiveResume = false,
}: ThemeDropdownProps = {}) {
  const {
    theme,
    resolvedTheme,
    setTheme,
    language,
    setLanguage,
    registerToggleElement,
  } = useTheme();

  const [mounted, setMounted] = React.useState(false);
  const [themeHovered, setThemeHovered] = React.useState(false);
  const [themeFocused, setThemeFocused] = React.useState(false);
  const [langHovered, setLangHovered] = React.useState(false);
  const [langFocused, setLangFocused] = React.useState(false);
  const [resumeHovered, setResumeHovered] = React.useState(false);
  const [resumeFocused, setResumeFocused] = React.useState(false);
  const [fetchedResume, setFetchedResume] = React.useState<ActiveResume | null>(null);

  const themeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const themeTooltipId = React.useId();
  const langTooltipId = React.useId();
  const resumeTooltipId = React.useId();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!autoFetchActiveResume || activeResume !== null) return;
    let isMounted = true;
    fetch("/api/resume/active")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { activeResume?: ActiveResume | null } | null) => {
        if (isMounted && data?.activeResume) {
          setFetchedResume(data.activeResume);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFetchedResume(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [autoFetchActiveResume, activeResume]);

  const effectiveResume = activeResume ?? fetchedResume;

  const setThemeButtonRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      themeButtonRef.current = node;
      registerToggleElement?.(node);
    },
    [registerToggleElement],
  );

  // 1. Theme state & options
  const activeTheme: Theme = mounted ? theme : "system";
  const activeResolved = mounted ? resolvedTheme : "light";
  const nextTheme: Theme = getNextCyclicTheme(activeTheme);

  const defaultThemeOption: ThemeOption = {
    value: "system",
    label: "System",
    modeLabel: "System Mode",
    icon: Monitor,
  };
  const currentThemeOption =
    THEME_OPTIONS.find((o) => o.value === activeTheme) ?? defaultThemeOption;
  const nextThemeOption =
    THEME_OPTIONS.find((o) => o.value === nextTheme) ?? defaultThemeOption;
  const CurrentThemeIcon = currentThemeOption.icon;
  const showThemeTooltip = themeHovered || themeFocused;

  // 2. Language state & options
  const activeLanguage: Language = mounted ? language : "en";
  const nextLanguage: Language = getNextCyclicLanguage(activeLanguage);
  const isId = activeLanguage === "id";
  const defaultLanguageOption: LanguageOption = {
    value: "en",
    label: "English",
    flag: "🇬🇧",
  };
  const currentLanguageOption =
    LANGUAGE_OPTIONS.find((l) => l.value === activeLanguage) ??
    defaultLanguageOption;
  const nextLanguageOption =
    LANGUAGE_OPTIONS.find((l) => l.value === nextLanguage) ??
    defaultLanguageOption;
  const showLanguageTooltip = langHovered || langFocused;
  const showResumeTooltip = resumeHovered || resumeFocused;

  const handleCycleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const origin = getElementCenterOrigin(themeButtonRef.current);
    setTheme(nextTheme, origin);
  };

  const handleCycleLanguage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setLanguage(nextLanguage);
  };

  return (
    <div
      role="region"
      aria-label="Theme, language, and quick actions"
      data-testid="floating-controls-group"
      className={cn(
        "inline-flex flex-col items-center gap-2 sm:gap-2.5",
        className,
      )}
    >
      {/* 1. Existing Vertical Dynamic Island Container (Theme + Language) */}
      <div
        role="group"
        aria-label="Theme and language controls"
        data-testid="floating-theme-language-island"
        className="inline-flex flex-col items-center gap-1.5 rounded-full border border-border-token/80 bg-background/90 p-1.5 shadow-sm backdrop-blur-md select-none"
      >
        {/* TOP CONTROL: Theme Toggle */}
        <div className="relative flex items-center justify-center">
          <div
            id={themeTooltipId}
            role="tooltip"
            aria-hidden={!showThemeTooltip}
            data-testid="theme-toggle-tooltip"
            data-visible={showThemeTooltip ? "true" : "false"}
            className={cn(
              "pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-[11px] font-medium leading-none tracking-tight text-background shadow-sm transition-all duration-150 ease-out select-none",
              showThemeTooltip
                ? "translate-x-0 scale-100 opacity-100"
                : "translate-x-1 scale-95 opacity-0",
            )}
          >
            <span>{currentThemeOption.modeLabel}</span>
            <span
              aria-hidden="true"
              data-testid="theme-tooltip-tail"
              className="pointer-events-none absolute -right-[5px] top-1/2 -translate-y-1/2 h-0 w-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-foreground"
            />
          </div>

          <button
            ref={setThemeButtonRef}
            type="button"
            onClick={handleCycleTheme}
            onMouseEnter={() => setThemeHovered(true)}
            onMouseLeave={() => setThemeHovered(false)}
            onFocus={() => setThemeFocused(true)}
            onBlur={() => setThemeFocused(false)}
            aria-describedby={themeTooltipId}
            aria-label={`Current theme: ${currentThemeOption.modeLabel}. Activate to switch to ${nextThemeOption.modeLabel}.`}
            data-testid="theme-switcher-dropdown"
            data-theme-mode={activeTheme}
            data-next-theme-mode={nextTheme}
            data-resolved-theme={activeResolved}
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-foreground transition-all duration-150 hover:bg-surface active:scale-95 focus-visible:outline-2 focus-visible:outline-accent select-none"
          >
            <CurrentThemeIcon
              data-testid={`theme-toggle-icon-${activeTheme}`}
              className="h-4 w-4 shrink-0 text-foreground transition-transform duration-200"
              aria-hidden="true"
            />
          </button>
        </div>

        {/* BOTTOM CONTROL: Language Toggle */}
        <div className="relative flex items-center justify-center">
          <div
            id={langTooltipId}
            role="tooltip"
            aria-hidden={!showLanguageTooltip}
            data-testid="language-toggle-tooltip"
            data-visible={showLanguageTooltip ? "true" : "false"}
            className={cn(
              "pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-[11px] font-medium leading-none tracking-tight text-background shadow-sm transition-all duration-150 ease-out select-none",
              showLanguageTooltip
                ? "translate-x-0 scale-100 opacity-100"
                : "translate-x-1 scale-95 opacity-0",
            )}
          >
            <span>{currentLanguageOption.label}</span>
            <span
              aria-hidden="true"
              data-testid="language-tooltip-tail"
              className="pointer-events-none absolute -right-[5px] top-1/2 -translate-y-1/2 h-0 w-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-foreground"
            />
          </div>

          <button
            type="button"
            onClick={handleCycleLanguage}
            onMouseEnter={() => setLangHovered(true)}
            onMouseLeave={() => setLangHovered(false)}
            onFocus={() => setLangFocused(true)}
            onBlur={() => setLangFocused(false)}
            aria-describedby={langTooltipId}
            aria-label={`Current language: ${currentLanguageOption.label}. Activate to switch to ${nextLanguageOption.label}.`}
            data-testid="language-switcher-button"
            data-language={activeLanguage}
            data-next-language={nextLanguage}
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-foreground transition-all duration-150 hover:bg-surface active:scale-95 focus-visible:outline-2 focus-visible:outline-accent select-none"
          >
            <span
              aria-hidden="true"
              data-testid={`language-flag-${activeLanguage}`}
              className="text-base leading-none select-none"
            >
              {currentLanguageOption.flag}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Third Circular Button: Separate Floating Resume Download Button */}
      {showResumeButton && effectiveResume?.fileUrl && (
        <div className="relative flex items-center justify-center">
          <div
            id={resumeTooltipId}
            role="tooltip"
            aria-hidden={!showResumeTooltip}
            data-testid="resume-download-tooltip"
            data-visible={showResumeTooltip ? "true" : "false"}
            className={cn(
              "pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-[11px] font-medium leading-none tracking-tight text-background shadow-sm transition-all duration-150 ease-out select-none",
              showResumeTooltip
                ? "translate-x-0 scale-100 opacity-100"
                : "translate-x-1 scale-95 opacity-0",
            )}
          >
            <span>{isId ? "Unduh Resume" : "Download Resume"}</span>
            <span
              aria-hidden="true"
              data-testid="resume-tooltip-tail"
              className="pointer-events-none absolute -right-[5px] top-1/2 -translate-y-1/2 h-0 w-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-foreground"
            />
          </div>

          <a
            href={`${effectiveResume.fileUrl}?download=true`}
            download={effectiveResume.fileName}
            onMouseEnter={() => setResumeHovered(true)}
            onMouseLeave={() => setResumeHovered(false)}
            onFocus={() => setResumeFocused(true)}
            onBlur={() => setResumeFocused(false)}
            aria-describedby={resumeTooltipId}
            aria-label={isId ? "Unduh Resume" : "Download Resume"}
            title={isId ? "Unduh Resume" : "Download Resume"}
            data-testid="floating-resume-download-button"
            className={cn(
              "inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-accent select-none shadow-xs border border-transparent",
              "bg-foreground text-background hover:opacity-90 dark:bg-foreground dark:text-background",
            )}
          >
            <FileDown
              className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0"
              aria-hidden="true"
            />
          </a>
        </div>
      )}
    </div>
  );
}
