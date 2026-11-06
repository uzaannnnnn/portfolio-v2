import type { Metadata } from "next";
import Link from "next/link";
import { getPortfolioRepository } from "@/lib/database/repository";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Engineering Notes",
  description:
    "Technical articles, system architecture notes, and software engineering write-ups by Muhamad Fauzan.",
};

export default async function NotesPage() {
  const repository = getPortfolioRepository();
  const notes = await repository.getPublishedNotes();

  return (
    <>
      <section className="border-b border-border-token bg-surface py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
            Technical Writing
          </p>
          <h1 className="type-page-heading mt-2 text-foreground">
            Engineering Notes
          </h1>
          <p className="type-body-lg mt-4 max-w-[720px] text-secondary-foreground">
            Notes on software architecture, backend systems, database design, and engineering trade-offs.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          {notes.length === 0 ? (
            <EmptyState
              title="No published engineering notes yet"
              description="Long-form engineering notes and technical articles are authored and published through the Admin Dashboard."
            />
          ) : (
            <div className="space-y-6">
              {notes.map((note) => (
                <article
                  key={note.id}
                  className="rounded-lg border border-border-token bg-background p-6"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">{note.category}</Badge>
                    {note.publishedAt && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {note.publishedAt}
                      </span>
                    )}
                  </div>
                  <h2 className="type-card-heading mt-3 text-foreground">
                    <Link
                      href={`/notes/${note.slug}`}
                      className="hover:underline"
                    >
                      {note.title}
                    </Link>
                  </h2>
                  <p className="type-body mt-2 max-w-[720px] text-secondary-foreground">
                    {note.summary}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
