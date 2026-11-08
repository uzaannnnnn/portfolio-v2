"use client";

import * as React from "react";
import {
  ArrowUpRight,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  Eye,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Monitor,
  Network,
  Server,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useLanguage } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  formatLocalizedEmploymentType,
  formatLocalizedWorkSystem,
  pickLocalizedList,
  pickLocalizedText,
} from "@/lib/i18n/localization";
import { formatCompactVisitorCount } from "@/lib/visitors/visitor-format";
import {
  TECHNOLOGY_CATEGORIES,
  type AboutContent,
  type CategorizedTechnologyItem,
  type CertificationItem,
  type EducationItem,
  type ExperienceItem,
  type HeroContent,
  type LanguagePreference,
  type ProfileData,
  type ProjectSummary,
  type SiteSettings,
  type TechnologyCategory,
} from "@/types/portfolio";

const MONTH_NAMES_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_NAMES_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export function formatEditorialMonthYear(
  month: number | null | undefined,
  year: number | null | undefined,
  language: LanguagePreference = "en",
): string {
  if (!year) return "";
  if (!month || month < 1 || month > 12) return String(year);
  const names = language === "id" ? MONTH_NAMES_ID : MONTH_NAMES_EN;
  return `${names[month - 1]} ${year}`;
}

export function sortExperiencesReverseChronological(
  experiences: readonly ExperienceItem[],
): ExperienceItem[] {
  return [...experiences].sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) {
      return a.isCurrent ? -1 : 1;
    }
    const aEndYear = a.isCurrent ? 9999 : (a.endYear ?? a.startYear);
    const bEndYear = b.isCurrent ? 9999 : (b.endYear ?? b.startYear);
    if (bEndYear !== aEndYear) {
      return bEndYear - aEndYear;
    }
    const aEndMonth = a.isCurrent ? 12 : (a.endMonth ?? a.startMonth);
    const bEndMonth = b.isCurrent ? 12 : (b.endMonth ?? b.startMonth);
    if (bEndMonth !== aEndMonth) {
      return bEndMonth - aEndMonth;
    }
    if (b.startYear !== a.startYear) {
      return b.startYear - a.startYear;
    }
    return b.startMonth - a.startMonth;
  });
}

const DEFAULT_ABOUT_FALLBACK: AboutContent = {
  introduction:
    "I am Muhamad Fauzan, a Software Engineer dedicated to designing, implementing, testing, and deploying maintainable software systems.",
  narrativeParagraphs: [
    "My engineering practice centers on clean system boundaries, explicit data modeling, and verifiable behavior across the stack. Whether building full-stack web platforms, backend services, or data-intensive applications, I prioritize clarity, reliability, and long-term maintainability.",
  ],
  engineeringPhilosophyTitle: "Engineering Principles",
  engineeringPhilosophySubtitle: "Core tenets that guide technical decisions and system design.",
  engineeringPillars: [
    {
      id: "pillar-architecture",
      title: "Architecture & Data Integrity First",
      summary:
        "Well-defined data schemas, explicit contracts, and clear module boundaries keep systems adaptable as complexity grows.",
      practices: [],
    },
    {
      id: "pillar-verification",
      title: "Verification Over Assumptions",
      summary:
        "Automated testing, static type checking, and reproducible workflows ensure software behaves predictably in production.",
      practices: [],
    },
    {
      id: "pillar-simplicity",
      title: "Maintainable Simplicity",
      summary:
        "Prefer straightforward, well-documented solutions that teams can reason about, debug, and evolve with confidence.",
      practices: [],
    },
  ],
  coreDomains: [],
};

/* ============================================================================
 * SECTION 1: HERO
 * Strictly 100svh full-screen slide with bilingual dynamic rendering & fallback
 * ============================================================================ */
export interface HomeHeroSectionProps {
  profile?: ProfileData;
  hero?: HeroContent;
}

export function HomeHeroSection({ profile, hero: _hero }: HomeHeroSectionProps) {
  const { language } = useLanguage();
  const isId = language === "id";
  const [visitorCount, setVisitorCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function fetchVisitorCount() {
      try {
        const alreadyCountedInSession =
          typeof window !== "undefined" &&
          sessionStorage.getItem("mf_visit_counted") === "1";

        const method = alreadyCountedInSession ? "GET" : "POST";
        const res = await fetch("/api/visitors", {
          method,
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as { count?: number | null };
        if (isMounted && typeof data.count === "number") {
          setVisitorCount(data.count);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("mf_visit_counted", "1");
          }
        }
      } catch {
        // Hero remains functional if visitor service fails
      }
    }

    void fetchVisitorCount();

    return () => {
      isMounted = false;
    };
  }, []);

  const fullName = profile?.fullName?.trim() || "Muhamad Fauzan";
  const professionalTitle =
    pickLocalizedText(
      language,
      profile?.professionalTitle,
      profile?.professionalTitleId,
    ) || "Software Engineer";

  const rawLocation = pickLocalizedText(
    language,
    profile?.location,
    profile?.locationId,
  );
  const locationText =
    rawLocation && rawLocation !== "Indonesia"
      ? rawLocation
      : isId
        ? "Bandung, Indonesia"
        : "Bandung, Indonesia";

  const githubUrl =
    profile?.githubUrl?.trim() || "https://github.com/uzaannnnnn";
  const linkedinUrl =
    profile?.linkedinUrl?.trim() || "https://linkedin.com/in/zanhoo";
  const emailAddress =
    profile?.email?.trim() || "vanz66hu@gmail.com";

  const socialLinks = [
    {
      name: "GitHub",
      href: githubUrl,
      icon: Github,
      ariaLabel: isId
        ? "Profil GitHub (buka di tab baru)"
        : "GitHub profile (opens in new tab)",
      isExternal: true,
      testId: "home-social-github",
    },
    {
      name: "LinkedIn",
      href: linkedinUrl,
      icon: Linkedin,
      ariaLabel: isId
        ? "Profil LinkedIn (buka di tab baru)"
        : "LinkedIn profile (opens in new tab)",
      isExternal: true,
      testId: "home-social-linkedin",
    },
    {
      name: "Gmail",
      href: `mailto:${emailAddress}`,
      icon: Mail,
      ariaLabel: isId
        ? `Kirim surel ke ${fullName} (buka aplikasi surel)`
        : `Send email to ${fullName} (opens email application)`,
      isExternal: false,
      testId: "home-social-gmail",
    },
  ];

  return (
    <section
      id="hero"
      aria-label="Personal Introduction"
      data-testid="home-landing-content"
      className="flex h-[100svh] min-h-[100svh] max-h-[100svh] w-full shrink-0 flex-col items-center justify-center overflow-hidden text-center px-4 py-8 select-text max-md:h-auto max-md:max-h-none max-md:overflow-visible max-md:py-12"
    >
      <div className="flex flex-col items-center text-center max-w-xl mx-auto">
        {/* 1. Large, bold Name */}
        <h1
          data-testid="home-name"
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight"
        >
          {fullName}
        </h1>

        {/* 2. Large, regular-weight Role */}
        <p
          data-testid="home-role"
          className="mt-2.5 sm:mt-3 text-xl sm:text-2xl md:text-3xl font-normal text-muted-foreground leading-snug"
        >
          {professionalTitle}
        </p>

        {/* 3. Small social icon buttons */}
        <div
          aria-label="Social and contact links"
          className="mt-6 sm:mt-7 flex items-center justify-center gap-3 sm:gap-3.5"
        >
          {socialLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.name}
                href={link.href}
                data-testid={link.testId}
                aria-label={link.ariaLabel}
                target={link.isExternal ? "_blank" : undefined}
                rel={link.isExternal ? "noopener noreferrer" : undefined}
                className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border-token bg-background text-foreground/75 transition-colors hover:bg-surface hover:text-foreground hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 no-underline shadow-2xs"
              >
                <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0" aria-hidden="true" />
              </a>
            );
          })}
        </div>

        {/* 4. Small, subtle Location */}
        <div
          data-testid="home-location"
          className="mt-4 sm:mt-5 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-muted-foreground"
        >
          <MapPin
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground/75"
            aria-hidden="true"
          />
          <span>{locationText}</span>
        </div>

        {/* 5. Minimal IP-Based Visitor Counter */}
        {visitorCount !== null && (
          <div
            data-testid="home-visitor-counter"
            className="mt-2.5 sm:mt-3 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-muted-foreground"
          >
            <Eye
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground/75"
              aria-hidden="true"
            />
            <span>
              {formatCompactVisitorCount(visitorCount, language)}{" "}
              {isId ? "pengunjung" : "visitors"}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
 * SECTION 2: ME (Personal Intro + Engineering Approach + Educational Background)
 * Strictly 100svh full-screen slide with curated density to fit one viewport
 * ============================================================================ */
export interface HomeMeSectionProps {
  profile?: Partial<ProfileData>;
  about?: AboutContent;
  educations?: readonly EducationItem[];
}

export function HomeMeSection({ profile, about, educations = [] }: HomeMeSectionProps) {
  const { language } = useLanguage();
  const isId = language === "id";
  const effectiveAbout = about ?? DEFAULT_ABOUT_FALLBACK;
  const publishedEducations = educations
    .filter((edu) => edu.status === "published")
    .slice(0, 2);
  const curatedPillars = (effectiveAbout.engineeringPillars ?? []).slice(0, 3);
  const localizedNarrativeList = pickLocalizedList(
    language,
    effectiveAbout.narrativeParagraphs,
    effectiveAbout.narrativeParagraphsId,
  );
  const primaryNarrative = localizedNarrativeList[0];
  const introductionText = pickLocalizedText(
    language,
    effectiveAbout.introduction || profile?.shortBio,
    effectiveAbout.introductionId || profile?.shortBioId,
  );

  return (
    <section
      id="me"
      aria-labelledby="home-heading-me"
      data-testid="home-section-me"
      className="flex h-[100svh] min-h-[100svh] max-h-[100svh] w-full shrink-0 flex-col items-center justify-center overflow-hidden px-4 sm:px-6 py-6 select-text max-md:h-auto max-md:max-h-none max-md:overflow-visible max-md:py-12"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col justify-center gap-4 sm:gap-6">
        <header className="text-center">
          <h2
            id="home-heading-me"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
          >
            {isId ? "Tentang Saya" : "Me"}
          </h2>
        </header>

        {/* Personal Introduction & Concise Narrative */}
        <div className="space-y-2.5 text-center sm:text-left">
          <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
            {introductionText}
          </p>
          {primaryNarrative && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">
              {primaryNarrative}
            </p>
          )}
        </div>

        {/* Engineering Approach / Philosophy (Curated 3-column grid on sm+) */}
        {curatedPillars.length > 0 && (
          <div className="pt-3 sm:pt-4 border-t border-border-token/50">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
              {isId ? "Pendekatan Rekayasa" : "Engineering Approach"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
              {curatedPillars.map((pillar) => (
                <div key={pillar.id} className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
                    {pickLocalizedText(language, pillar.title, pillar.titleId)}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2 sm:line-clamp-3">
                    {pickLocalizedText(language, pillar.summary, pillar.summaryId)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integrated Education Subsection (Strictly inside Me, never a separate section) */}
        <div
          data-testid="home-me-education"
          className="pt-3 sm:pt-4 border-t border-border-token/50"
        >
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {isId ? "Pendidikan" : "Education"}
          </h3>
          {publishedEducations.length > 0 ? (
            <div className="space-y-3">
              {publishedEducations.map((edu) => {
                const localizedDegree = pickLocalizedText(language, edu.degree, edu.degreeId);
                const localizedMajor = pickLocalizedText(language, edu.major, edu.majorId);
                const localizedDescription = pickLocalizedText(
                  language,
                  edu.description,
                  edu.descriptionId,
                );
                const period = `${edu.startDate} — ${
                  edu.isCurrent
                    ? isId
                      ? "Sekarang"
                      : "Present"
                    : (edu.endDate ?? (isId ? "Selesai" : "Completed"))
                }`;
                return (
                  <div
                    key={edu.id}
                    data-testid={`home-education-item-${edu.id}`}
                    className="space-y-0.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                        {edu.institution}
                      </h4>
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                        {period}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/85">
                      {localizedDegree}
                      {localizedMajor ? (isId ? ` bidang ${localizedMajor}` : ` in ${localizedMajor}`) : ""}
                    </p>
                    {edu.gpa && (
                      <p className="text-xs text-muted-foreground">{isId ? "IPK" : "GPA"}: {edu.gpa}</p>
                    )}
                    {localizedDescription && (
                      <p className="text-xs text-muted-foreground leading-snug line-clamp-1">
                        {localizedDescription}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isId
                ? "Fondasi akademik di bidang rekayasa perangkat lunak dan ilmu komputer—berfokus pada algoritma, perancangan basis data relasional, arsitektur perangkat lunak, dan verifikasi sistem."
                : "Academic foundation in software engineering and computer science—focused on algorithms, relational database design, software architecture, and formal system verification."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * SECTION 3: EXPERIENCE
 * Strictly 100svh full-screen slide with reverse chronological ordering
 * ============================================================================ */
export interface HomeExperienceSectionProps {
  experiences?: readonly ExperienceItem[];
}

export function HomeExperienceSection({ experiences = [] }: HomeExperienceSectionProps) {
  const { language } = useLanguage();
  const isId = language === "id";
  const publishedExperiences = sortExperiencesReverseChronological(
    experiences.filter((exp) => exp.status === "published"),
  ).slice(0, 3);

  return (
    <section
      id="experience"
      aria-labelledby="home-heading-experience"
      data-testid="home-section-experience"
      className="flex h-[100svh] min-h-[100svh] max-h-[100svh] w-full shrink-0 flex-col items-center justify-center overflow-hidden px-4 sm:px-6 py-6 select-text max-md:h-auto max-md:max-h-none max-md:overflow-visible max-md:py-12"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col justify-center gap-6 sm:gap-8">
        <header className="text-center">
          <h2
            id="home-heading-experience"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
          >
            {isId ? "Pengalaman" : "Experience"}
          </h2>
        </header>

        {publishedExperiences.length > 0 ? (
          <div className="space-y-5 sm:space-y-6">
            {publishedExperiences.map((exp) => {
              const localizedRole = pickLocalizedText(language, exp.role, exp.roleId);
              const localizedDescription = pickLocalizedText(
                language,
                exp.description,
                exp.descriptionId,
              );
              const employmentTypeLabel = exp.employmentType
                ? formatLocalizedEmploymentType(exp.employmentType, language)
                : "";
              const workSystemLabel = exp.workSystem
                ? formatLocalizedWorkSystem(exp.workSystem, language)
                : "";
              const startLabel = formatEditorialMonthYear(exp.startMonth, exp.startYear, language);
              const endLabel = exp.isCurrent
                ? isId
                  ? "Sekarang"
                  : "Present"
                : formatEditorialMonthYear(exp.endMonth, exp.endYear, language) ||
                  (isId ? "Selesai" : "Completed");
              const period = `${startLabel} — ${endLabel}`;

              return (
                <article
                  key={exp.id}
                  data-testid={`home-experience-item-${exp.id}`}
                  className="space-y-1.5 border-b border-border-token/40 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                        {localizedRole}
                      </h3>
                      <p className="text-xs sm:text-sm text-foreground/80">
                        {exp.organization}
                        {employmentTypeLabel ? ` · ${employmentTypeLabel}` : ""}
                        {workSystemLabel ? ` · ${workSystemLabel}` : ""}
                        {exp.location ? ` · ${exp.location}` : ""}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      {period}
                    </span>
                  </div>

                  {localizedDescription && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-snug line-clamp-2">
                      {localizedDescription}
                    </p>
                  )}

                  {exp.technologies && exp.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {exp.technologies.slice(0, 5).map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center rounded-full border border-border-token bg-surface/60 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div data-testid="home-experience-empty" className="text-center py-4">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {isId
                ? "Riwayat pengalaman profesional terverifikasi akan dipublikasikan di sini."
                : "Verified professional experience entries will be published here as career milestones are finalized."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
/* ============================================================================
 * SECTION 4: SHOWCASE (Strictly Published Projects Only, Curated to Fit 100svh)
 * ============================================================================ */
export interface HomeShowcaseSectionProps {
  projects?: readonly ProjectSummary[];
}

const CATEGORY_ICONS: Record<
  TechnologyCategory,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>
> = {
  FE: Monitor,
  BE: Server,
  DB: Database,
  API: Network,
  ARCHITECTURE: Workflow,
  "DEVOPS & INFRA": Cloud,
  "SOFTWARE QUALITY": ShieldCheck,
};

interface ShowcaseActionButtonProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  testId: string;
}

function ShowcaseActionButton({
  href,
  label,
  icon: Icon,
  testId,
}: ShowcaseActionButtonProps) {
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const showTooltip = hovered || focused;
  const tooltipId = `${testId}-tooltip-id`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        role="tooltip"
        id={tooltipId}
        aria-hidden={!showTooltip}
        data-testid={`${testId}-tooltip`}
        data-visible={showTooltip ? "true" : "false"}
        className={cn(
          "pointer-events-none absolute bottom-full mb-1.5 right-0 z-30 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-medium leading-none tracking-tight text-background shadow-xs transition-all duration-150 ease-out select-none",
          showTooltip
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-1 scale-95 opacity-0",
        )}
      >
        <span>{label}</span>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        aria-describedby={showTooltip ? tooltipId : undefined}
        data-testid={testId}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/75 hover:text-foreground hover:bg-surface/60 focus-visible:outline-2 focus-visible:outline-accent active:scale-95 transition-all select-none"
      >
        <Icon className="h-4 w-4 shrink-0 transition-colors" aria-hidden="true" />
      </a>
    </div>
  );
}

export function orderTechnologiesByCategory(
  items: readonly CategorizedTechnologyItem[],
): CategorizedTechnologyItem[] {
  const result: CategorizedTechnologyItem[] = [];
  const handled = new Set<number>();

  for (const category of TECHNOLOGY_CATEGORIES) {
    items.forEach((item, index) => {
      if (item.category === category) {
        result.push(item);
        handled.add(index);
      }
    });
  }

  items.forEach((item, index) => {
    if (!handled.has(index)) {
      result.push(item);
    }
  });

  return result;
}

const CAROUSEL_PAGE_SIZE = 3;
const H_GESTURE_THRESHOLD = 30;
const H_GESTURE_GAP_MS = 70;

export function HomeShowcaseSection({ projects = [] }: HomeShowcaseSectionProps) {
  const { language } = useLanguage();
  const isId = language === "id";
  // Defensive publication filter: only status === "published" may ever appear publicly
  const publishedProjects = React.useMemo(
    () =>
      [...projects]
        .filter((proj) => proj.status === "published")
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [projects],
  );

  // Desktop: 3 cards per page. Mobile: 1 card per page.
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const pageSize = isMobile ? 1 : CAROUSEL_PAGE_SIZE;
  const totalPages = Math.ceil(publishedProjects.length / pageSize);

  // Group published projects into pages: 3 per page on desktop, 1 per page on mobile
  const pages = React.useMemo(() => {
    const result: ProjectSummary[][] = [];
    for (let i = 0; i < publishedProjects.length; i += pageSize) {
      result.push(publishedProjects.slice(i, i + pageSize));
    }
    return result;
  }, [publishedProjects, pageSize]);

  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const currentPageRef = React.useRef<number>(0);
  currentPageRef.current = currentPage;

  // Ensure currentPage stays within valid bounds if projects change dynamically
  React.useEffect(() => {
    if (totalPages > 0 && currentPage >= totalPages) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  const goToPage = React.useCallback(
    (pageIdx: number) => {
      if (totalPages === 0) return;
      const clamped = Math.max(0, Math.min(totalPages - 1, pageIdx));
      if (clamped !== currentPageRef.current) {
        currentPageRef.current = clamped;
        setCurrentPage(clamped);
      }
    },
    [totalPages],
  );

  // Visual drag / swipe offset state for real-time tactile interaction
  const [dragOffset, setDragOffset] = React.useState<number>(0);
  const [isInteracting, setIsInteracting] = React.useState<boolean>(false);

  // Ref tracking for gestures
  const isMouseDownRef = React.useRef<boolean>(false);
  const mouseStartXRef = React.useRef<number>(0);
  const isDraggingRef = React.useRef<boolean>(false);

  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const isTouchingRef = React.useRef<boolean>(false);

  // Horizontal trackpad wheel gesture state machine (gap detection + gesture locking)
  const hWheelLockedRef = React.useRef<boolean>(false);
  const hWheelLockedDirRef = React.useRef<1 | -1 | 0>(0);
  const hDeltaAccumRef = React.useRef<number>(0);
  const lastHWheelTimeRef = React.useRef<number>(0);
  const hWheelTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHWheelState = React.useCallback(() => {
    hWheelLockedRef.current = false;
    hWheelLockedDirRef.current = 0;
    hDeltaAccumRef.current = 0;
  }, []);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (hWheelTimerRef.current) {
        clearTimeout(hWheelTimerRef.current);
      }
    };
  }, []);

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || totalPages <= 1) return;
    isMouseDownRef.current = true;
    mouseStartXRef.current = e.clientX;
    isDraggingRef.current = false;
    setIsInteracting(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current) return;
    const diffX = e.clientX - mouseStartXRef.current;
    if (Math.abs(diffX) > 6) {
      isDraggingRef.current = true;
      // Dampen drag at boundaries
      const atStart = currentPageRef.current === 0 && diffX > 0;
      const atEnd = currentPageRef.current === totalPages - 1 && diffX < 0;
      setDragOffset(atStart || atEnd ? diffX * 0.3 : diffX);
    }
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    setIsInteracting(false);

    const diffX = e.clientX - mouseStartXRef.current;
    setDragOffset(0);

    if (isDraggingRef.current) {
      if (Math.abs(diffX) >= 45) {
        if (diffX < 0) {
          goToPage(currentPageRef.current + 1);
        } else {
          goToPage(currentPageRef.current - 1);
        }
      }
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    }
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (totalPages <= 1 || e.touches.length !== 1 || !e.touches[0]) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isTouchingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null || !e.touches[0]) return;
    const diffX = e.touches[0].clientX - touchStartXRef.current;
    const diffY = e.touches[0].clientY - touchStartYRef.current;

    // If horizontal touch movement is dominant
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
      isTouchingRef.current = true;
      setIsInteracting(true);
      const atStart = currentPageRef.current === 0 && diffX > 0;
      const atEnd = currentPageRef.current === totalPages - 1 && diffX < 0;
      setDragOffset(atStart || atEnd ? diffX * 0.3 : diffX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || !e.changedTouches[0]) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartXRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    setIsInteracting(false);
    setDragOffset(0);

    if (isTouchingRef.current) {
      isTouchingRef.current = false;
      if (Math.abs(diffX) >= 40) {
        if (diffX < 0) {
          goToPage(currentPageRef.current + 1);
        } else {
          goToPage(currentPageRef.current - 1);
        }
      }
    }
  };

  const handleTouchCancel = () => {
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isTouchingRef.current = false;
    setIsInteracting(false);
    setDragOffset(0);
  };

  // Horizontal Wheel & Trackpad gesture handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (totalPages <= 1) return;

    // Detect horizontal trackpad movement or Shift + wheel
    const isShift = e.shiftKey;
    const isHorizontalTrackpad = Math.abs(e.deltaX) > Math.abs(e.deltaY);

    if (!isShift && !isHorizontalTrackpad) {
      // Pure vertical gesture: let it bubble to HomeFullScreenDeck for full-screen section navigation
      return;
    }

    const effectiveDelta = isShift ? e.deltaY : e.deltaX;
    if (Math.abs(effectiveDelta) === 0) return;

    const eventDir: 1 | -1 = effectiveDelta > 0 ? 1 : -1;
    const now = Date.now();
    const dt = lastHWheelTimeRef.current > 0 ? now - lastHWheelTimeRef.current : Infinity;
    lastHWheelTimeRef.current = now;

    if (dt >= H_GESTURE_GAP_MS) {
      resetHWheelState();
    }

    if (hWheelTimerRef.current) {
      clearTimeout(hWheelTimerRef.current);
    }
    hWheelTimerRef.current = setTimeout(() => {
      resetHWheelState();
    }, H_GESTURE_GAP_MS);

    // If currently locked to prevent skipping multiple pages from one gesture stream:
    if (hWheelLockedRef.current) {
      // Direction reversal unlocks immediately
      if (eventDir !== hWheelLockedDirRef.current) {
        resetHWheelState();
      } else {
        return;
      }
    }

    hDeltaAccumRef.current += effectiveDelta;

    if (Math.abs(hDeltaAccumRef.current) >= H_GESTURE_THRESHOLD) {
      const step: 1 | -1 = hDeltaAccumRef.current > 0 ? 1 : -1;
      hDeltaAccumRef.current = 0;
      hWheelLockedRef.current = true;
      hWheelLockedDirRef.current = step;

      goToPage(currentPageRef.current + step);
    }
  };

  return (
    <section
      id="showcase"
      aria-labelledby="home-heading-showcase"
      data-testid="home-section-showcase"
      className="flex h-[100svh] min-h-[100svh] max-h-[100svh] w-full shrink-0 flex-col items-center justify-center overflow-hidden px-4 sm:px-6 py-6 select-text max-md:h-auto max-md:max-h-none max-md:overflow-visible max-md:py-12"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col justify-center gap-3 sm:gap-4">
        <header className="text-center">
          <h2
            id="home-heading-showcase"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
          >
            {isId ? "Karya Pilihan" : "Showcase"}
          </h2>
        </header>

        {publishedProjects.length > 0 ? (
          <div className="flex flex-col w-full">
            {/* Horizontal Carousel Viewport Container */}
            <div
              data-testid="home-showcase-carousel-viewport"
              className={cn(
                "w-full overflow-hidden select-none touch-pan-y",
                totalPages > 1
                  ? isInteracting
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : "cursor-default",
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onClickCapture={handleClickCapture}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              onWheel={handleWheel}
            >
              <div
                data-testid="home-showcase-carousel-track"
                style={{
                  transform: `translate3d(calc(-${currentPage * 100}% + ${dragOffset}px), 0, 0)`,
                  transition: isInteracting
                    ? "none"
                    : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
                  willChange: "transform",
                }}
                className="flex w-full flex-row"
              >
                {pages.map((pageProjects, pageIdx) => (
                  <div
                    key={pageIdx}
                    data-testid={`showcase-page-${pageIdx}`}
                    data-page-index={pageIdx}
                    className={cn(
                      "w-full shrink-0 flex-none flex flex-row items-stretch gap-2.5 sm:gap-3.5 md:gap-4 lg:gap-5 px-1 py-1",
                      // Center-align incomplete final page (1 or 2 projects) and balanced pages
                      "justify-center",
                    )}
                  >
                    {pageProjects.map((project) => {
                      const localizedDescription = pickLocalizedText(
                        language,
                        project.description,
                        project.descriptionId,
                      );
                      const isGitHubRepo = project.githubUrl
                        ? /github\.com/i.test(project.githubUrl)
                        : false;
                      const RepoIcon = isGitHubRepo ? Github : Code2;
                      const hasActions = Boolean(
                        project.liveDemoUrl || project.githubUrl,
                      );

                      const rawTechs: CategorizedTechnologyItem[] =
                        project.categorizedTechnologies &&
                        project.categorizedTechnologies.length > 0
                          ? project.categorizedTechnologies
                          : (project.technologies || []).map((tech) => ({
                              category: "ARCHITECTURE" as const,
                              name: tech,
                            }));

                      const displayTechs = orderTechnologiesByCategory(rawTechs);

                      return (
                        <article
                          key={project.id}
                          data-testid={`home-showcase-item-${project.slug}`}
                          className={cn(
                            "showcase-card flex flex-col justify-between shrink-0 rounded-xl border border-border-token bg-background/50 p-2.5 sm:p-3.5 md:p-4 transition-colors hover:border-border-strong/70 max-h-[calc(100svh-175px)] overflow-y-auto select-text",
                          )}
                        >
                          <div className="space-y-2 sm:space-y-2.5">
                            {project.coverUrl && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={project.coverUrl}
                                alt={`${project.name} preview`}
                                loading="lazy"
                                className="w-full h-auto max-h-[140px] sm:max-h-[180px] lg:max-h-[220px] object-contain rounded-lg pointer-events-none"
                                data-testid={`project-image-${project.slug}`}
                              />
                            )}

                            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-foreground tracking-tight truncate">
                                {project.name}
                              </h3>
                              {project.version && (
                                <span
                                  data-testid={`project-version-${project.slug}`}
                                  className="font-mono text-xs font-normal text-muted-foreground shrink-0"
                                >
                                  {project.version}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {localizedDescription}
                            </p>

                            {displayTechs.length > 0 && (
                              <div
                                data-testid={`home-showcase-technologies-${project.slug}`}
                                className="flex flex-wrap gap-1 sm:gap-1.5 pt-0.5"
                              >
                                {displayTechs.map((item, idx) => {
                                  const CategoryIcon =
                                    CATEGORY_ICONS[item.category] || Workflow;
                                  return (
                                    <span
                                      key={`${item.category}-${item.name}-${idx}`}
                                      data-testid={`tech-pill-${project.slug}-${idx}`}
                                      className="inline-flex items-center gap-1 rounded-full border border-border-token bg-surface/60 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] md:text-[11px] font-medium text-secondary-foreground"
                                    >
                                      <CategoryIcon
                                        className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground shrink-0"
                                        aria-hidden="true"
                                      />
                                      <span>{item.name}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Showcase Action Links Underneath Description/Metadata (Right Aligned: Source Code -> Live Demo) */}
                          {hasActions && (
                            <div
                              data-testid={`home-showcase-actions-${project.slug}`}
                              className="flex items-center justify-end gap-1.5 pt-2 mt-1.5 sm:pt-2.5 sm:mt-2 border-t border-border-token/40 text-xs font-medium"
                            >
                              {project.githubUrl && (
                                <ShowcaseActionButton
                                  href={project.githubUrl}
                                  label={isId ? "Kode Sumber" : "Source Code"}
                                  icon={RepoIcon}
                                  testId={`home-showcase-source-code-${project.slug}`}
                                />
                              )}
                              {project.liveDemoUrl && (
                                <ShowcaseActionButton
                                  href={project.liveDemoUrl}
                                  label={isId ? "Demo Langsung" : "Live Demo"}
                                  icon={ExternalLink}
                                  testId={`home-showcase-live-demo-${project.slug}`}
                                />
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Separate Oval Progress Indicators */}
            {totalPages > 0 && (
              <div
                data-testid="showcase-carousel-indicators"
                role="tablist"
                aria-label={
                  isId
                    ? "Navigasi halaman karya pilihan"
                    : "Showcase project page navigation"
                }
                className="mt-3 sm:mt-4 flex items-center justify-center gap-2 sm:gap-2.5 select-none"
              >
                {Array.from({ length: totalPages }).map((_, pageIdx) => {
                  const isActive = pageIdx === currentPage;
                  return (
                    <button
                      key={pageIdx}
                      type="button"
                      role="tab"
                      data-testid={`showcase-page-indicator-${pageIdx}`}
                      data-active={isActive ? "true" : "false"}
                      aria-selected={isActive}
                      aria-label={
                        isMobile
                          ? isId
                            ? `Buka proyek ${pageIdx + 1} dari ${totalPages}`
                            : `Go to project ${pageIdx + 1} of ${totalPages}`
                          : isId
                            ? `Buka halaman proyek ${pageIdx + 1} dari ${totalPages}`
                            : `Go to project page ${pageIdx + 1} of ${totalPages}`
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPage(pageIdx);
                      }}
                      className={cn(
                        "h-1.5 w-6 sm:w-7 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-2 focus-visible:outline-accent",
                        isActive
                          ? "bg-foreground shadow-xs scale-105"
                          : "bg-border-token hover:bg-muted-foreground/50",
                      )}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div data-testid="home-showcase-empty" className="text-center py-4">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {isId
                ? "Studi kasus rekayasa perangkat lunak pilihan sedang disiapkan untuk publikasi."
                : "Selected engineering case studies are currently being prepared for publication."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
 * SECTION 5: CERTIFICATIONS
 * Strictly 100svh full-screen slide with curated density
 * ============================================================================ */
export interface HomeCertificationsSectionProps {
  certifications?: readonly CertificationItem[];
}

export function HomeCertificationsSection({
  certifications = [],
}: HomeCertificationsSectionProps) {
  const { language } = useLanguage();
  const isId = language === "id";
  const publishedCertifications = [...certifications]
    .filter((cert) => cert.status === "published")
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 4);

  return (
    <section
      id="certifications"
      aria-labelledby="home-heading-certifications"
      data-testid="home-section-certifications"
      className="flex h-[100svh] min-h-[100svh] max-h-[100svh] w-full shrink-0 flex-col items-center justify-center overflow-hidden px-4 sm:px-6 py-6 select-text max-md:h-auto max-md:max-h-none max-md:overflow-visible max-md:py-12"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col justify-center gap-6 sm:gap-8">
        <header className="text-center">
          <h2
            id="home-heading-certifications"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
          >
            {isId ? "Sertifikasi" : "Certifications"}
          </h2>
        </header>

        {publishedCertifications.length > 0 ? (
          <div className="space-y-4 sm:space-y-5">
            {publishedCertifications.map((cert) => {
              const issuedDate = formatEditorialMonthYear(cert.issueMonth, cert.issueYear, language);
              const hasExpiration =
                cert.expirationYear !== null && cert.expirationYear !== undefined;
              const expirationDate = hasExpiration
                ? formatEditorialMonthYear(cert.expirationMonth, cert.expirationYear, language)
                : null;
              const localizedDescription = pickLocalizedText(
                language,
                cert.description,
                cert.descriptionId,
              );

              return (
                <article
                  key={cert.id}
                  data-testid={`home-certification-item-${cert.id}`}
                  className="space-y-1 border-b border-border-token/40 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                        {cert.credentialUrl ? (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-foreground hover:text-muted-foreground transition-colors no-underline"
                          >
                            <span>{cert.name}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          </a>
                        ) : (
                          cert.name
                        )}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {cert.issuingOrganization}
                      </p>
                    </div>

                    <div className="text-[11px] font-mono text-muted-foreground shrink-0">
                      <span>
                        {isId ? `Terbit ${issuedDate}` : `Issued ${issuedDate}`}
                      </span>
                      {expirationDate && (
                        <span data-testid={`home-certification-expiration-${cert.id}`}>
                          {" "}
                          ·{" "}
                          {isId
                            ? `Berlaku s/d ${expirationDate}`
                            : `Expires ${expirationDate}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {localizedDescription && (
                    <p className="text-xs text-muted-foreground leading-snug">
                      {localizedDescription}
                    </p>
                  )}

                  {cert.credentialId && (
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Credential ID: {cert.credentialId}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div data-testid="home-certifications-empty" className="text-center py-4">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {isId
                ? "Sertifikasi teknis dan kredensial terverifikasi akan ditampilkan di sini setelah dipublikasikan."
                : "Verified technical certifications and credentials will be listed here upon publication."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
 * SECTION 6: CONTACT (with Minimal Footer anchored inside the 100svh slide)
 * ============================================================================ */
export interface HomeContactSectionProps {
  profile?: Partial<ProfileData>;
  siteSettings?: Partial<SiteSettings>;
}

export function HomeContactSection({
  profile,
  siteSettings,
}: HomeContactSectionProps = {}) {
  const { language } = useLanguage();
  const isId = language === "id";
  const currentYear = new Date().getFullYear();

  const rawHeading = pickLocalizedText(
    language,
    profile?.contactHeading,
    profile?.contactHeadingId,
  );
  const headingText = rawHeading || (isId ? "Kontak" : "Contact");

  const invitationText =
    pickLocalizedText(
      language,
      profile?.availabilityNote,
      profile?.availabilityNoteId,
    ) ||
    (isId
      ? "Terbuka untuk peluang rekayasa perangkat lunak, diskusi teknis, dan kolaborasi. Silakan hubungi langsung."
      : "Open to software engineering roles, technical discussions, and collaborations. Feel free to reach out directly.");

  const supportText = pickLocalizedText(
    language,
    profile?.contactSupportText,
    profile?.contactSupportTextId,
  );

  const footerText = pickLocalizedText(
    language,
    siteSettings?.footerText,
    siteSettings?.footerTextId,
  );

  const emailAddress = profile?.email?.trim() || "vanz66hu@gmail.com";
  const githubUrl =
    profile?.githubUrl?.trim() || "https://github.com/uzaannnnnn";
  const linkedinUrl =
    profile?.linkedinUrl?.trim() || "https://linkedin.com/in/zanhoo";
  const copyrightName =
    profile?.fullName?.trim() ||
    siteSettings?.bootWelcome?.welcomeName?.trim() ||
    "Muhamad Fauzan";

  const githubLabel = githubUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const linkedinLabel = linkedinUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  return (
    <section
      id="contact"
      aria-labelledby="home-heading-contact"
      data-testid="home-section-contact"
      className="flex h-[100svh] min-h-[100svh] max-h-[100svh] w-full shrink-0 flex-col items-center justify-between overflow-hidden px-4 sm:px-6 py-8 select-text max-md:h-auto max-md:max-h-none max-md:overflow-visible max-md:py-12"
    >
      {/* Top balance spacer so Contact content stays visually centered */}
      <div aria-hidden="true" className="h-4 shrink-0" />

      <div className="my-auto mx-auto max-w-xl text-center">
        <header className="mb-6">
          <h2
            id="home-heading-contact"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
          >
            {headingText}
          </h2>
          {supportText && (
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {supportText}
            </p>
          )}
        </header>

        <p
          data-testid="home-contact-invitation"
          className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto"
        >
          {invitationText}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <a
            href={`mailto:${emailAddress}`}
            data-testid="home-contact-email"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors no-underline"
          >
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>{emailAddress}</span>
          </a>

          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="home-contact-github"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors no-underline"
          >
            <Github className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>{githubLabel}</span>
          </a>

          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="home-contact-linkedin"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors no-underline"
          >
            <Linkedin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>{linkedinLabel}</span>
          </a>
        </div>
      </div>

      {/* Minimal Footer integrated at the bottom edge of the Contact viewport */}
      <footer
        data-testid="home-footer"
        className="w-full pt-4 text-center shrink-0 space-y-1"
      >
        <p className="text-xs text-muted-foreground">
          &copy; {currentYear} {copyrightName}
        </p>
        {footerText && (
          <p className="text-[11px] text-muted-foreground/80">
            {footerText}
          </p>
        )}
      </footer>
    </section>
  );
}
