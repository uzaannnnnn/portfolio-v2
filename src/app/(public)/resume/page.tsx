import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { getPortfolioRepository } from "@/lib/database/repository";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Curriculum Vitae and technical resume of Muhamad Fauzan — Software Engineer.",
  alternates: {
    canonical: "/resume",
  },
  openGraph: {
    title: "Resume | Muhamad Fauzan",
    description:
      "Curriculum Vitae and technical resume of Muhamad Fauzan — Software Engineer.",
    url: "/resume",
    type: "website",
  },
};

export default async function ResumePage() {
  const repository = getPortfolioRepository();
  const bundle = await repository.getPublicPortfolioBundle();
  const activeResume = bundle.activeResume;

  return (
    <>
      <section className="border-b border-border-token bg-surface py-14 md:py-20">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-6 px-5 sm:px-8 md:flex-row md:items-end">
          <div className="max-w-[720px]">
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
              Curriculum Vitae
            </p>
            <h1 className="type-page-heading mt-2 text-foreground">
              Resume & Technical Summary
            </h1>
            <p className="type-body-lg mt-4 text-secondary-foreground">
              {bundle.profile.fullName} — {bundle.profile.professionalTitle}
            </p>
          </div>

          <div>
            {activeResume?.fileUrl ? (
              <a
                href={activeResume.fileUrl}
                download={activeResume.fileName}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-button-primary px-6 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Download PDF ({activeResume.versionLabel})</span>
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border-token bg-background px-5 text-xs font-mono text-muted-foreground"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                <span>PDF Resume Not Yet Published</span>
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] space-y-12 px-5 sm:px-8">
          {!activeResume?.fileUrl && (
            <EmptyState
              title="No published PDF resume file is currently active"
              description="The active PDF resume is managed through the Admin Resume Manager. Once an official PDF version is uploaded and marked published, the download button above will point directly to that verified document."
              action={
                <Link
                  href="/contact"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-button-primary px-4 text-xs font-medium text-white hover:bg-foreground/90"
                >
                  Request CV via Contact Page
                </Link>
              }
            />
          )}

          {/* Structured Web Summary */}
          <div className="rounded-lg border border-border-token bg-background p-6 md:p-10">
            <div className="border-b border-border-token pb-6">
              <h2 className="type-section-heading text-foreground">
                {bundle.profile.fullName}
              </h2>
              <p className="mt-1 font-mono text-sm text-accent">
                {bundle.profile.professionalTitle}
              </p>
              <p className="type-body mt-4 max-w-[720px] text-secondary-foreground">
                {bundle.profile.shortBio}
              </p>
            </div>

            <div className="mt-8">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Technical Capabilities by Category
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bundle.skillCategories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-md border border-border-token bg-surface p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {category.name}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {category.skills.map((skill) => (
                        <Badge key={skill.id} variant="outline" className="bg-background">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
