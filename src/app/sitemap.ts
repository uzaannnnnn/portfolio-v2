import type { MetadataRoute } from "next";
import { getPortfolioRepository, type PortfolioDataRepository } from "@/lib/database/repository";

export async function buildPublicSitemap(
  repository?: PortfolioDataRepository,
): Promise<MetadataRoute.Sitemap> {
  const repo = repository ?? getPortfolioRepository();
  const bundle = await repo.getPublicPortfolioBundle();

  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    bundle.siteSettings.canonicalBaseUrl ??
    "http://localhost:3000"
  ).replace(/\/$/, "");

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date("2026-11-06T00:00:00.000Z"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildPublicSitemap();
}
