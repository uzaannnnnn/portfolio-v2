import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SafeMdxRenderer } from "@/components/public/safe-mdx-renderer";
import { ArchitectureDiagramView } from "@/components/case-study/architecture-diagram-view";
import {
  CASE_STUDY_SECTION_LABELS,
  type ProjectDetail,
  type ProjectSummary,
} from "@/types/portfolio";

export interface CaseStudyViewProps {
  project: ProjectDetail;
  relatedProjects?: ProjectSummary[];
}

export function CaseStudyView({
  project,
  relatedProjects = [],
}: CaseStudyViewProps) {
  const enabledSections = [...project.caseStudySections]
    .filter((section) => section.isEnabled && section.content.trim().length > 0)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <article className="py-14 md:py-20" data-testid="case-study-article">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Projects Directory</span>
        </Link>

        {/* Case Study Header */}
        <header className="mt-8 border-b border-border-token pb-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="accent">{project.category}</Badge>
            <Badge variant="outline">{project.projectCompletionState}</Badge>
          </div>

          <h1 className="type-page-heading mt-4 text-foreground">
            {project.name}
          </h1>

          <p className="type-body-lg mt-4 max-w-[760px] text-secondary-foreground">
            {project.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <Badge key={tech} variant="default">
                {tech}
              </Badge>
            ))}
          </div>

          {(project.githubUrl || project.liveDemoUrl) && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-button-primary px-4 text-xs font-medium text-white hover:bg-foreground/90"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  <span>Source Repository</span>
                </a>
              )}
              {project.liveDemoUrl && (
                <a
                  href={project.liveDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border-token bg-background px-4 text-xs font-medium text-foreground hover:bg-surface"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span>Live Demo</span>
                </a>
              )}
            </div>
          )}
        </header>

        {/* Main Content + Section Index Grid */}
        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Sticky Table of Contents */}
          {enabledSections.length > 0 && (
            <aside
              aria-label="Case study sections"
              className="lg:col-span-4"
            >
              <div className="rounded-lg border border-border-token bg-surface p-5 lg:sticky lg:top-24">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Case Study Index ({enabledSections.length})
                </p>
                <ol className="mt-4 space-y-2 text-sm">
                  {enabledSections.map((section, idx) => (
                    <li key={section.id}>
                      <a
                        href={`#section-${section.sectionType}`}
                        className="flex items-baseline gap-2.5 text-secondary-foreground transition-colors hover:text-foreground"
                      >
                        <span className="font-mono text-xs text-accent">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span>
                          {section.title ||
                            CASE_STUDY_SECTION_LABELS[section.sectionType]}
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          )}

          {/* Ordered Case Study Sections */}
          <div className="space-y-12 lg:col-span-8">
            {enabledSections.map((section, idx) => {
              const sectionHeading =
                section.title || CASE_STUDY_SECTION_LABELS[section.sectionType];

              return (
                <section
                  key={section.id}
                  id={`section-${section.sectionType}`}
                  data-testid={`case-study-section-${section.sectionType}`}
                  className="scroll-mt-24 space-y-4 border-b border-border-token pb-10 last:border-b-0"
                >
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent">
                    <span>Section {String(idx + 1).padStart(2, "0")}</span>
                    <span>•</span>
                    <span>{CASE_STUDY_SECTION_LABELS[section.sectionType]}</span>
                  </div>

                  <h2 className="type-section-heading text-foreground">
                    {sectionHeading}
                  </h2>

                  <SafeMdxRenderer content={section.content} />

                  {section.sectionType === "architecture" &&
                    project.architectureDiagram && (
                      <div className="pt-4">
                        <ArchitectureDiagramView
                          diagram={project.architectureDiagram}
                        />
                      </div>
                    )}
                </section>
              );
            })}

            {/* If project has an architecture diagram but no explicit architecture section enabled */}
            {project.architectureDiagram &&
              !enabledSections.some((s) => s.sectionType === "architecture") && (
                <ArchitectureDiagramView diagram={project.architectureDiagram} />
              )}
          </div>
        </div>

        {/* Related Published Projects Navigation */}
        {relatedProjects.length > 0 && (
          <section
            aria-label="Other published engineering projects"
            data-testid="related-projects-section"
            className="mt-16 border-t border-border-token pt-12"
          >
            <h2 className="type-card-heading text-foreground">
              Other Published Engineering Case Studies
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {relatedProjects.map((related) => (
                <Link
                  key={related.id}
                  href={`/projects/${related.slug}`}
                  className="group flex flex-col justify-between rounded-lg border border-border-token bg-surface p-5 transition-colors hover:border-foreground/30"
                >
                  <div>
                    <Badge variant="outline">{related.category}</Badge>
                    <p className="mt-3 text-base font-semibold text-foreground group-hover:underline">
                      {related.name}
                    </p>
                    <p className="mt-1 text-sm text-secondary-foreground">
                      {related.description}
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent">
                    Read Case Study
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
