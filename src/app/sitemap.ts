import type { MetadataRoute } from "next";
import { getPortfolioRepository, type PortfolioDataRepository } from "@/lib/database/repository";

export async function buildPublicSitemap(
  repository?: PortfolioDataRepository,
): Promise<MetadataRoute.Sitemap> {
  const repo = repository ?? getPortfolioRepository();
  const [bundle, publishedProjects, publishedNotes] = await Promise.all([
    repo.getPublicPortfolioBundle(),
    repo.getPublishedProjects(),
    repo.getPublishedNotes(),
  ]);

  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    bundle.siteSettings.canonicalBaseUrl ??
    "http://localhost:3000"
  ).replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date("2026-11-06T00:00:00.000Z"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date("2026-11-06T00:00:00.000Z"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2026-11-06T00:00:00.000Z"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/notes`,
      lastModified: new Date("2026-11-06T00:00:00.000Z"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resume`,
      lastModified: new Date("2026-11-06T00:00:00.000Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date("2026-11-06T00:00:00.000Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Strictly include only published projects
  const projectRoutes: MetadataRoute.Sitemap = publishedProjects
    .filter((project) => project.status === "published")
    .map((project) => ({
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: new Date(project.updatedAt),
      changeFrequency: "monthly",
      priority: 0.85,
    }));

  // Strictly include only published notes
  const noteRoutes: MetadataRoute.Sitemap = publishedNotes
    .filter((note) => note.status === "published")
    .map((note) => ({
      url: `${baseUrl}/notes/${note.slug}`,
      lastModified: new Date(note.publishedAt ?? "2026-11-06T00:00:00.000Z"),
      changeFrequency: "monthly",
      priority: 0.75,
    }));

  return [...staticRoutes, ...projectRoutes, ...noteRoutes];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildPublicSitemap();
}
