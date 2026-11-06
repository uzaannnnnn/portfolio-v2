import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, Github } from "lucide-react";
import { getPortfolioRepository } from "@/lib/database/repository";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Software engineering projects and architectural case studies by Muhamad Fauzan.",
};

export default async function ProjectsPage() {
  const repository = getPortfolioRepository();
  const projects = await repository.getPublishedProjects();

  return (
    <>
      <section className="border-b border-border-token bg-surface py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
            Engineering Case Studies
          </p>
          <h1 className="type-page-heading mt-2 text-foreground">
            Projects Directory
          </h1>
          <p className="type-body-lg mt-4 max-w-[720px] text-secondary-foreground">
            Detailed systems engineering work, architectural decisions, database schemas, and implementation trade-offs.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          {projects.length === 0 ? (
            <EmptyState
              title="No published projects are live yet"
              description="Initial project entries (GeoEntity, ClayCV, and SPK Bansos SAW) are currently stored in DRAFT state awaiting final case-study verification and explicit publication."
              note="Only projects with status = 'published' are exposed on public routes."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="flex flex-col justify-between rounded-lg border border-border-token bg-background p-6"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="accent">{project.category}</Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {project.projectCompletionState}
                      </span>
                    </div>
                    <h2 className="type-card-heading mt-4 text-foreground">
                      <Link
                        href={`/projects/${project.slug}`}
                        className="hover:underline"
                      >
                        {project.name}
                      </Link>
                    </h2>
                    <p className="type-body mt-2 text-secondary-foreground">
                      {project.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} variant="outline">
                          {tech}
                        </Badge>
                      ))}
                    </div>
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
        </div>
      </section>
    </>
  );
}
