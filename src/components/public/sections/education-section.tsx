import { SectionContainer } from "@/components/ui/section-container";
import { EmptyState } from "@/components/ui/empty-state";
import type { EducationItem } from "@/types/portfolio";

export interface EducationSectionProps {
  educations: EducationItem[];
}

export function EducationSection({ educations }: EducationSectionProps) {
  return (
    <SectionContainer
      id="education"
      surface="secondary"
      eyebrow="06 / Academic Foundation"
      title="Education"
      description="Academic background, degree information, and research focus."
    >
      {educations.length === 0 ? (
        <EmptyState
          title="No published education records yet"
          description="Academic history and thesis details are configurable in the Admin Dashboard and are only displayed once published."
        />
      ) : (
        <div className="space-y-6">
          {educations.map((edu) => (
            <article
              key={edu.id}
              className="rounded-lg border border-border-token bg-background p-6 md:p-8"
            >
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-baseline">
                <div>
                  <h3 className="type-card-heading text-foreground">
                    {edu.institution}
                  </h3>
                  <p className="text-sm font-medium text-secondary-foreground">
                    {edu.degree} — {edu.major}
                  </p>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {edu.startDate} — {edu.isCurrent ? "Present" : edu.endDate ?? ""}
                </p>
              </div>

              {(edu.gpa || edu.thesisTitle || edu.defenseGrade || edu.description) && (
                <div className="mt-4 space-y-2 border-t border-border-token pt-4 text-sm text-secondary-foreground">
                  {edu.gpa && (
                    <p>
                      <span className="font-medium text-foreground">GPA:</span> {edu.gpa}
                    </p>
                  )}
                  {edu.thesisTitle && (
                    <p>
                      <span className="font-medium text-foreground">Thesis:</span>{" "}
                      {edu.thesisTitle}
                    </p>
                  )}
                  {edu.defenseGrade && (
                    <p>
                      <span className="font-medium text-foreground">Defense Grade:</span>{" "}
                      {edu.defenseGrade}
                    </p>
                  )}
                  {edu.description && <p className="mt-2">{edu.description}</p>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </SectionContainer>
  );
}
