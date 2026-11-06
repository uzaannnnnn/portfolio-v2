import type { Metadata } from "next";
import { getPortfolioRepository } from "@/lib/database/repository";
import { ContactSection } from "@/components/public/sections/contact-section";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Muhamad Fauzan for software engineering opportunities and technical inquiries.",
};

export default async function ContactPage() {
  const repository = getPortfolioRepository();
  const bundle = await repository.getPublicPortfolioBundle();

  return (
    <>
      <section className="border-b border-border-token bg-surface py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
            Direct Communication
          </p>
          <h1 className="type-page-heading mt-2 text-foreground">
            Contact {bundle.profile.fullName}
          </h1>
          <p className="type-body-lg mt-4 max-w-[720px] text-secondary-foreground">
            Reach out regarding software engineering opportunities, backend/full-stack systems work, or technical discussions.
          </p>
        </div>
      </section>

      <ContactSection profile={bundle.profile} />
    </>
  );
}
