import Link from "next/link";
import { ArrowRight, ExternalLink, Github } from "lucide-react";
import { SectionContainer } from "@/components/ui/section-container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProjectSummary } from "@/types/portfolio";

export interface FeaturedProjectsSectionProps {
  projects: ProjectSummary[];
}

export function FeaturedProjectsSection({ projects }: FeaturedProjectsSectionProps) {
  return (
    <SectionContainer
      id="projects"
      eyebrow="03 / Selected Engineering Work"
      title="Featured Projects & Case Studies"
      description="Production systems and engineering case studies documenting problem statements, architectural decisions, database schemas, and verification results."
      headerAction={
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <span>View Project Directory</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      {projects.length === 0 ? (
        <EmptyState
          title="Engineering case studies are currently in draft review"
          description="Only verified, published projects appear publicly. Initial project entries (such as GeoEntity, ClayCV, and SPK Bansos SAW) are staged as drafts until their complete case studies are reviewed and published from the Admin Dashboard."
          note="Rule 4 Enforced: Draft projects are strictly isolated from anonymous public queries."
          action={
            <Link
              href="/projects"
              className="inline-flex h-9 items-center justify-center rounded-md border border-border-token bg-background px-4 text-xs font-medium text-foreground transition-colors hover:bg-surface"
            >
              Open Projects Page
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.id}
              className="flex flex-col justify-between rounded-lg border border-border-token bg-background p-6 transition-colors hover:border-foreground/30"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="accent">{project.category}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {project.projectCompletionState}
                  </span>
                </div>

                <h3 className="type-card-heading mt-4 text-foreground">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="hover:underline"
                  >
                    {project.name}
                  </Link>
                </h3>

                <p className="type-body mt-2 text-secondary-foreground">
                  {project.description}
                </p>

                {project.technologies.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {project.technologies.map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border-token pt-4 text-sm">
                <Link
                  href={`/projects/${project.slug}`}
                  className="inline-flex items-center gap-1 font-medium text-foreground hover:text-accent"
                >
                  <span>Read Case Study</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>

                <div className="flex items-center gap-3">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.name} GitHub repository`}
                      className="text-secondary-foreground hover:text-foreground"
                    >
                      <Github className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                  {project.liveDemoUrl && (
                    <a
                      href={project.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.name} live demo`}
                      className="text-secondary-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionContainer>
  );
}
