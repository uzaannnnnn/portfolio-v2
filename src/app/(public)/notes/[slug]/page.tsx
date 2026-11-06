import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Lock } from "lucide-react";
import { getOptionalAdminSession } from "@/lib/auth/session";
import { getCmsStore } from "@/lib/database/cms-store";
import { getPortfolioRepository } from "@/lib/database/repository";
import { Badge } from "@/components/ui/badge";
import { SafeMdxRenderer } from "@/components/public/safe-mdx-renderer";
import type { EngineeringNote } from "@/types/portfolio";

interface NoteDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: NoteDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;

  if (resolvedSearch?.preview === "true") {
    return {
      title: "Admin Note Draft Preview",
      robots: { index: false, follow: false },
    };
  }

  const repository = getPortfolioRepository();
  const note = await repository.getPublishedNoteBySlug(slug);

  if (!note) {
    return {
      title: "Note Not Found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: note.seoTitle ?? note.title,
    description: note.seoDescription ?? note.summary,
    alternates: {
      canonical: `/notes/${note.slug}`,
    },
    openGraph: {
      title: note.seoTitle ?? note.title,
      description: note.seoDescription ?? note.summary,
      url: `/notes/${note.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: note.seoTitle ?? note.title,
      description: note.seoDescription ?? note.summary,
    },
  };
}

export default async function NoteDetailPage({
  params,
  searchParams,
}: NoteDetailPageProps) {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const isPreviewRequested = resolvedSearch?.preview === "true";

  let note: EngineeringNote | null = null;
  let previewStatus: string | null = null;

  if (isPreviewRequested) {
    const admin = await getOptionalAdminSession();
    if (!admin) {
      notFound();
    }
    const record = getCmsStore()
      .listByType<EngineeringNote>("note")
      .find((r) => r.slug === slug || r.draftData.slug === slug);

    if (!record) {
      notFound();
    }
    note = record.draftData;
    previewStatus = record.status;
  } else {
    const repository = getPortfolioRepository();
    note = await repository.getPublishedNoteBySlug(slug);
  }

  if (!note) {
    notFound();
  }

  return (
    <div>
      {isPreviewRequested && (
        <div
          className="border-b border-border-strong bg-elevated-surface py-3"
          data-testid="admin-preview-banner"
        >
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 sm:px-8">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Eye className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>
                ADMIN DRAFT PREVIEW MODE — Viewing unpublished note draft. Public status:{" "}
                <strong className="uppercase">{previewStatus}</strong>
              </span>
            </div>
            <Link
              href="/admin/notes"
              className="inline-flex items-center gap-1.5 rounded-md border border-border-token bg-surface px-3 py-1 text-xs font-medium text-foreground hover:border-border-strong"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Return to Notes CMS</span>
            </Link>
          </div>
        </div>
      )}
      <article className="py-14 md:py-20" data-testid="note-detail-article">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <Link
            href="/notes"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Engineering Notes</span>
          </Link>

          <header className="mt-8 max-w-[760px] border-b border-border-token pb-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">{note.category}</Badge>
              {note.publishedAt && (
                <span className="font-mono text-xs text-muted-foreground">
                  Published {note.publishedAt}
                </span>
              )}
            </div>
            <h1 className="type-page-heading mt-4 text-foreground">
              {note.title}
            </h1>
            <p className="type-body-lg mt-4 text-secondary-foreground">
              {note.summary}
            </p>
            {note.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          <div className="mt-10 max-w-[720px]">
            <SafeMdxRenderer content={note.contentMdx} />
          </div>
        </div>
      </article>
    </div>
  );
}
