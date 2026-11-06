import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPortfolioRepository } from "@/lib/database/repository";
import { Badge } from "@/components/ui/badge";

interface NoteDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: NoteDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
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
  };
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { slug } = await params;
  const repository = getPortfolioRepository();
  const note = await repository.getPublishedNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  return (
    <article className="py-14 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Link
          href="/notes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Notes</span>
        </Link>

        <header className="mt-8 max-w-[720px] border-b border-border-token pb-8">
          <Badge variant="accent">{note.category}</Badge>
          <h1 className="type-page-heading mt-4 text-foreground">
            {note.title}
          </h1>
          <p className="type-body-lg mt-4 text-secondary-foreground">
            {note.summary}
          </p>
        </header>

        <div className="type-body mt-10 max-w-[720px] whitespace-pre-line text-secondary-foreground">
          {note.contentMdx}
        </div>
      </div>
    </article>
  );
}
