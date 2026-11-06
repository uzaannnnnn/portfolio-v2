import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Lock } from "lucide-react";
import { getOptionalAdminSession } from "@/lib/auth/session";
import { getCmsStore } from "@/lib/database/cms-store";
import { getPortfolioRepository } from "@/lib/database/repository";
import { CaseStudyView } from "@/components/case-study/case-study-view";
import type { ProjectDetail } from "@/types/portfolio";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;

  if (resolvedSearch?.preview === "true") {
    return {
      title: "Admin Draft Preview",
      robots: { index: false, follow: false },
    };
  }

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
  searchParams,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const isPreviewRequested = resolvedSearch?.preview === "true";

  const repository = getPortfolioRepository();

  if (isPreviewRequested) {
    const admin = await getOptionalAdminSession();
    if (!admin) {
      notFound();
    }

    const store = getCmsStore();
    const record = store
      .listByType<ProjectDetail>("project")
      .find((r) => r.slug === slug || r.draftData.slug === slug);

    if (!record) {
      notFound();
    }

    const allPublished = await repository.getPublishedProjects();
    const relatedProjects = allPublished.filter(
      (item) => item.slug !== record.draftData.slug,
    );

    return (
      <div>
        <div
          className="border-b border-border-strong bg-elevated-surface py-3"
          data-testid="admin-preview-banner"
        >
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 sm:px-8">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Eye className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>
                ADMIN DRAFT PREVIEW MODE — Viewing unpublished draft snapshot (
                <code className="font-mono">{record.draftRevisionId ?? "draft"}</code>
                ). Public status:{" "}
                <strong className="uppercase">{record.status}</strong>
              </span>
            </div>
            <Link
              href="/admin/projects"
              className="inline-flex items-center gap-1.5 rounded-md border border-border-token bg-surface px-3 py-1 text-xs font-medium text-foreground hover:border-border-strong"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Return to Project CMS</span>
            </Link>
          </div>
        </div>
        <CaseStudyView
          project={record.draftData}
          relatedProjects={relatedProjects}
        />
      </div>
    );
  }

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
