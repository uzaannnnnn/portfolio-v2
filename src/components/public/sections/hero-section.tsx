import Link from "next/link";
import { ArrowRight, CheckCircle2, Github, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { HeroContent, ProfileData } from "@/types/portfolio";

export interface HeroSectionProps {
  profile: ProfileData;
  hero: HeroContent;
}

export function HeroSection({ profile, hero }: HeroSectionProps) {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="border-b border-border-token bg-background py-20 md:py-28"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-[840px]">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge variant="accent" className="font-mono uppercase tracking-wider">
              {hero.eyebrow}
            </Badge>
            {profile.availableForWork && (
              <Badge variant="success" className="gap-1.5">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                <span>{profile.availabilityNote}</span>
              </Badge>
            )}
          </div>

          <h1 id="hero-heading" className="type-hero-heading text-foreground">
            {hero.headline}
          </h1>

          <p className="type-body-lg mt-6 max-w-[700px] text-secondary-foreground">
            {hero.supportingDescription}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              href={hero.primaryCtaHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-button-primary px-6 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
            >
              <span>{hero.primaryCtaLabel}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link
              href={hero.secondaryCtaHref}
              className="inline-flex h-11 items-center justify-center rounded-md border border-border-token bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              {hero.secondaryCtaLabel}
            </Link>

            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                <span>GitHub</span>
              </a>
            )}
          </div>

          {/* Identity Metadata & Focus Areas */}
          <div className="mt-14 border-t border-border-token pt-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-center gap-4 text-sm text-secondary-foreground">
                <span className="font-semibold text-foreground">
                  {profile.fullName}
                </span>
                <span aria-hidden="true" className="text-border-token">
                  •
                </span>
                <span>{profile.professionalTitle}</span>
                {profile.location && (
                  <>
                    <span aria-hidden="true" className="text-border-token">
                      •
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                      {profile.location}
                    </span>
                  </>
                )}
              </div>

              {hero.engineeringFocusAreas.length > 0 && (
                <div
                  className="flex flex-wrap gap-2"
                  aria-label="Engineering focus areas"
                >
                  {hero.engineeringFocusAreas.map((area) => (
                    <Badge key={area} variant="outline" className="font-mono text-[11px]">
                      {area}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
