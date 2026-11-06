import type { ProfileData, SiteSettings } from "@/types/portfolio";

export interface StructuredDataGraph {
  "@context": "https://schema.org";
  "@graph": Array<Record<string, unknown>>;
}

/**
 * Generates accurate Person and WebSite JSON-LD structured data.
 * Never fabricates employer relationships, credentials, or unverified claims.
 */
export function buildPortfolioStructuredData(params: {
  profile: ProfileData;
  siteSettings: SiteSettings;
}): StructuredDataGraph {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    params.siteSettings.canonicalBaseUrl ??
    "http://localhost:3000"
  ).replace(/\/$/, "");

  const sameAs = [params.profile.githubUrl, params.profile.linkedinUrl].filter(
    (url): url is string => Boolean(url && url.trim().length > 0),
  );

  const personEntity: Record<string, unknown> = {
    "@type": "Person",
    "@id": `${baseUrl}/#person`,
    name: params.profile.fullName,
    jobTitle: params.profile.professionalTitle,
    description: params.profile.shortBio,
    url: baseUrl,
    ...(params.profile.location
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: params.profile.location,
          },
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const websiteEntity: Record<string, unknown> = {
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: params.siteSettings.siteTitle,
    description: params.siteSettings.siteDescription,
    publisher: {
      "@id": `${baseUrl}/#person`,
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [personEntity, websiteEntity],
  };
}
