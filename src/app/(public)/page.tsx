import type { Metadata } from "next";
import * as React from "react";
import { getPortfolioRepository } from "@/lib/database/repository";
import { buildPortfolioStructuredData } from "@/lib/seo/structured-data";
import { HeroSection } from "@/components/public/sections/hero-section";
import { AboutSection } from "@/components/public/sections/about-section";
import { SkillsSection } from "@/components/public/sections/skills-section";
import { FeaturedProjectsSection } from "@/components/public/sections/featured-projects-section";
import { ExperienceSection } from "@/components/public/sections/experience-section";
import { PhilosophySection } from "@/components/public/sections/philosophy-section";
import { EducationSection } from "@/components/public/sections/education-section";
import { CertificationsSection } from "@/components/public/sections/certifications-section";
import { ContactSection } from "@/components/public/sections/contact-section";
import type { HomepageSectionKey } from "@/types/portfolio";

export const metadata: Metadata = {
  title: "Muhamad Fauzan — Software Engineer",
  description:
    "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Muhamad Fauzan — Software Engineer",
    description:
      "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muhamad Fauzan — Software Engineer",
    description:
      "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
  },
};

export default async function PublicHomePage() {
  const repository = getPortfolioRepository();
  const bundle = await repository.getPublicPortfolioBundle();
  const structuredData = buildPortfolioStructuredData({
    profile: bundle.profile,
    siteSettings: bundle.siteSettings,
  });

  const sectionRenderers: Record<HomepageSectionKey, React.ReactNode> = {
    hero: <HeroSection key="hero" profile={bundle.profile} hero={bundle.hero} />,
    about: (
      <AboutSection
        key="about"
        profile={bundle.profile}
        about={bundle.about}
        showReadMoreLink={true}
      />
    ),
    skills: <SkillsSection key="skills" categories={bundle.skillCategories} />,
    featured_projects: (
      <FeaturedProjectsSection
        key="featured_projects"
        projects={bundle.featuredProjects}
      />
    ),
    experience: (
      <ExperienceSection key="experience" experiences={bundle.experiences} />
    ),
    philosophy: <PhilosophySection key="philosophy" about={bundle.about} />,
    education: <EducationSection key="education" educations={bundle.educations} />,
    certifications: (
      <CertificationsSection
        key="certifications"
        certifications={bundle.certifications}
      />
    ),
    contact: <ContactSection key="contact" profile={bundle.profile} />,
  };

  return (
    <>
      <script
        id="portfolio-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      {bundle.siteSettings.homepageSectionOrder.map(
        (sectionKey) => sectionRenderers[sectionKey] ?? null,
      )}
    </>
  );
}
