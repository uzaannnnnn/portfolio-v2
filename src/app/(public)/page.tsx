import type { Metadata } from "next";
import { getPortfolioRepository } from "@/lib/database/repository";
import { buildPortfolioStructuredData } from "@/lib/seo/structured-data";
import { HomeFullScreenDeck } from "@/components/public/home-fullscreen-deck";
import {
  HomeCertificationsSection,
  HomeContactSection,
  HomeExperienceSection,
  HomeHeroSection,
  HomeMeSection,
  HomeShowcaseSection,
} from "@/components/public/home-sections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: {
    absolute: "Muhamad Fauzan",
  },
  description:
    "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Muhamad Fauzan",
    description:
      "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muhamad Fauzan",
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

  return (
    <>
      <script
        id="portfolio-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <HomeFullScreenDeck>
        {/* 1. Hero Section (preserved visual reference, strictly 100svh, CMS-backed) */}
        <HomeHeroSection profile={bundle.profile} hero={bundle.hero} />

        {/* 2. Me Section (Personal Intro + Engineering Approach + Education) */}
        <HomeMeSection
          profile={bundle.profile}
          about={bundle.about}
          educations={bundle.educations}
        />

        {/* 3. Experience Section */}
        <HomeExperienceSection experiences={bundle.experiences} />

        {/* 4. Showcase Section (Published Projects Only) */}
        <HomeShowcaseSection projects={bundle.allPublishedProjects} />

        {/* 5. Certifications Section */}
        <HomeCertificationsSection certifications={bundle.certifications} />

        {/* 6. Contact Section (with Minimal Footer integrated at bottom of 100svh) */}
        <HomeContactSection
          profile={bundle.profile}
          siteSettings={bundle.siteSettings}
        />
      </HomeFullScreenDeck>
    </>
  );
}
