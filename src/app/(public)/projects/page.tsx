import type { Metadata } from "next";
import { getPortfolioRepository } from "@/lib/database/repository";
import { ProjectDirectory } from "@/components/public/project-directory";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Software engineering projects and architectural case studies by Muhamad Fauzan.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Projects | Muhamad Fauzan",
    description:
      "Software engineering projects and architectural case studies by Muhamad Fauzan.",
    url: "/projects",
    type: "website",
  },
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
          <ProjectDirectory projects={projects} />
        </div>
      </section>
    </>
  );
}
