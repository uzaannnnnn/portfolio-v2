import type { Metadata } from "next";
import { getPortfolioRepository } from "@/lib/database/repository";
import { AboutSection } from "@/components/public/sections/about-section";
import { PhilosophySection } from "@/components/public/sections/philosophy-section";
import { SkillsSection } from "@/components/public/sections/skills-section";
import { ExperienceSection } from "@/components/public/sections/experience-section";
import { EducationSection } from "@/components/public/sections/education-section";
import { CertificationsSection } from "@/components/public/sections/certifications-section";

export const metadata: Metadata = {
  title: "About",
  description:
    "Background, engineering philosophy, technical expertise, and academic foundation of Muhamad Fauzan.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About | Muhamad Fauzan",
    description:
      "Background, engineering philosophy, technical expertise, and academic foundation of Muhamad Fauzan.",
    url: "/about",
    type: "profile",
  },
};

export default async function AboutPage() {
  const repository = getPortfolioRepository();
  const bundle = await repository.getPublicPortfolioBundle();

  return (
    <>
      <section className="border-b border-border-token bg-surface py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
            Profile & Engineering Approach
          </p>
          <h1 className="type-page-heading mt-2 text-foreground">
            {bundle.profile.fullName}
          </h1>
          <p className="type-body-lg mt-4 max-w-[720px] text-secondary-foreground">
            {bundle.profile.shortBio}
          </p>
        </div>
      </section>

      <AboutSection
        profile={bundle.profile}
        about={bundle.about}
        showReadMoreLink={false}
      />
      <PhilosophySection about={bundle.about} />
      <SkillsSection categories={bundle.skillCategories} />
      <ExperienceSection experiences={bundle.experiences} />
      <EducationSection educations={bundle.educations} />
      <CertificationsSection certifications={bundle.certifications} />
    </>
  );
}
