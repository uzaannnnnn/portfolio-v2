import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPortfolioRepository } from "@/lib/database/repository";
import { CaseStudyView } from "@/components/case-study/case-study-view";

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
    alternates: {
      canonical: `/projects/${project.slug}`,
    },
    openGraph: {
      title: `${project.name} — Engineering Case Study`,
      description: project.description,
      url: `/projects/${project.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.name} — Engineering Case Study`,
      description: project.description,
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const repository = getPortfolioRepository();
  const [project, allPublished] = await Promise.all([
    repository.getPublishedProjectBySlug(slug),
    repository.getPublishedProjects(),
  ]);

  if (!project) {
    notFound();
  }

  const relatedProjects = allPublished.filter((item) => item.slug !== project.slug);

  return <CaseStudyView project={project} relatedProjects={relatedProjects} />;
}
