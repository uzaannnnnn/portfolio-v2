import { SectionContainer } from "@/components/ui/section-container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { SkillCategory } from "@/types/portfolio";

export interface SkillsSectionProps {
  categories: SkillCategory[];
}

export function SkillsSection({ categories }: SkillsSectionProps) {
  return (
    <SectionContainer
      id="skills"
      surface="secondary"
      eyebrow="02 / Technical Stack"
      title="Technical Expertise"
      description="Structured overview of programming languages, frameworks, data stores, and engineering practices—organized by domain without arbitrary percentage bars."
    >
      {categories.length === 0 ? (
        <EmptyState
          title="No published skill categories yet"
          description="Technical skill categories are managed via the Admin Dashboard and will appear here once published."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.id}
              className="flex flex-col justify-between rounded-lg border border-border-token bg-background p-6"
            >
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="type-card-heading text-foreground">
                    {category.name}
                  </h3>
                  <span className="font-mono text-xs text-muted-foreground">
                    {category.skills.length}
                  </span>
                </div>
                {category.description && (
                  <p className="type-caption mt-1.5 text-secondary-foreground">
                    {category.description}
                  </p>
                )}

                <ul
                  className="mt-5 flex flex-wrap gap-2"
                  aria-label={`${category.name} skills`}
                >
                  {category.skills.map((skill) => (
                    <li key={skill.id}>
                      <Badge
                        variant="default"
                        className="px-2.5 py-1 text-xs font-medium"
                      >
                        <span>{skill.name}</span>
                        {skill.proficiency && (
                          <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                            · {skill.proficiency}
                          </span>
                        )}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionContainer>
  );
}
