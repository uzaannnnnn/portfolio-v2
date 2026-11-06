import * as React from "react";
import { getPortfolioRepository } from "@/lib/database/repository";
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

export default async function PublicHomePage() {
  const repository = getPortfolioRepository();
  const bundle = await repository.getPublicPortfolioBundle();

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
      {bundle.siteSettings.homepageSectionOrder.map(
        (sectionKey) => sectionRenderers[sectionKey] ?? null,
      )}
    </>
  );
}
