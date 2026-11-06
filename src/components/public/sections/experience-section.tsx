import { SectionContainer } from "@/components/ui/section-container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPeriodRange } from "@/lib/utils";
import type { ExperienceItem } from "@/types/portfolio";

export interface ExperienceSectionProps {
  experiences: ExperienceItem[];
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  return (
    <SectionContainer
      id="experience"
      surface="secondary"
      eyebrow="04 / Career & Practice"
      title="Engineering Experience"
      description="Verified professional roles, internships, and technical engagements."
    >
      {experiences.length === 0 ? (
        <EmptyState
          title="No published experience records yet"
          description="Professional experience entries are managed through the Admin Dashboard. Per engineering integrity rules, no unverified roles or employer histories are fabricated."
        />
      ) : (
        <div className="space-y-6">
          {experiences.map((exp) => (
            <article
              key={exp.id}
              className="rounded-lg border border-border-token bg-background p-6 md:p-8"
            >
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-baseline">
                <div>
                  <h3 className="type-card-heading text-foreground">
                    {exp.role}
                  </h3>
                  <p className="text-sm font-medium text-secondary-foreground">
                    {exp.organization}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span>
                    {formatPeriodRange({
                      startMonth: exp.startMonth,
                      startYear: exp.startYear,
                      endMonth: exp.endMonth,
                      endYear: exp.endYear,
                      isCurrent: exp.isCurrent,
                    })}
                  </span>
                  <span>•</span>
                  <Badge variant="outline">{exp.employmentType}</Badge>
                  <Badge variant="outline">{exp.workSystem}</Badge>
                  {exp.location && <span>{exp.location}</span>}
                </div>
              </div>

              {exp.description && (
                <p className="type-body mt-4 max-w-[720px] text-secondary-foreground">
                  {exp.description}
                </p>
              )}

              {exp.responsibilities.length > 0 && (
                <div className="mt-4">
                  <p className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Responsibilities & Contributions
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-secondary-foreground">
                    {exp.responsibilities.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {exp.technologies.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {exp.technologies.map((tech) => (
                    <Badge key={tech} variant="default">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </SectionContainer>
  );
}
