import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { getPortfolioRepository } from "@/lib/database/repository";
import { Badge } from "@/components/ui/badge";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const repository = getPortfolioRepository();
  const project = await repository.getPublishedProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: project.name,
    description: project.description,
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const repository = getPortfolioRepository();
  const project = await repository.getPublishedProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const enabledSections = project.caseStudySections
    .filter((section) => section.isEnabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <article className="py-14 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Projects</span>
        </Link>

        <header className="mt-8 border-b border-border-token pb-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="accent">{project.category}</Badge>
            <Badge variant="outline">{project.projectCompletionState}</Badge>
          </div>

          <h1 className="type-page-heading mt-4 text-foreground">
            {project.name}
          </h1>

          <p className="type-body-lg mt-4 max-w-[720px] text-secondary-foreground">
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

        <div className="mt-12 max-w-[720px] space-y-10">
          {enabledSections.map((section) => (
            <section key={section.id} className="space-y-3">
              <h2 className="type-section-heading text-foreground">
                {section.title}
              </h2>
              <p className="type-body text-secondary-foreground">
                {section.content}
              </p>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
