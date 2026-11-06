import { SectionContainer } from "@/components/ui/section-container";
import type { AboutContent } from "@/types/portfolio";

export interface PhilosophySectionProps {
  about: AboutContent;
}

export function PhilosophySection({ about }: PhilosophySectionProps) {
  return (
    <SectionContainer
      id="philosophy"
      eyebrow="05 / Engineering Standards"
      title={about.engineeringPhilosophyTitle}
      description={about.engineeringPhilosophySubtitle}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {about.engineeringPillars.map((pillar, index) => (
          <article
            key={pillar.id}
            className="flex flex-col justify-between rounded-lg border border-border-token bg-surface p-6"
          >
            <div>
              <p className="font-mono text-xs font-medium text-accent">
                0{index + 1}
              </p>
              <h3 className="type-card-heading mt-2 text-foreground">
                {pillar.title}
              </h3>
              <p className="type-body mt-2.5 text-secondary-foreground">
                {pillar.summary}
              </p>
            </div>

            {pillar.practices.length > 0 && (
              <ul className="mt-6 space-y-2 border-t border-border-token pt-4 text-xs text-secondary-foreground">
                {pillar.practices.map((practice) => (
                  <li key={practice} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </SectionContainer>
  );
}
