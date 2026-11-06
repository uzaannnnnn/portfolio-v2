import { revalidatePath, revalidateTag } from "next/cache";
import type { PublishableEntityType } from "@/types/database";

export interface RevalidationPlan {
  paths: string[];
  tags: string[];
}

export interface RevalidationExecutor {
  revalidatePath: (path: string) => void;
  revalidateTag: (tag: string) => void;
}

/**
 * Computes the exact Next.js cache paths and tags that must be invalidated
 * when an entity is published, unpublished, or archived.
 */
export function buildCacheRevalidationPlan(params: {
  entityType: PublishableEntityType;
  slug?: string;
}): RevalidationPlan {
  const paths = new Set<string>(["/", "/sitemap.xml"]);
  const tags = new Set<string>(["portfolio-bundle", `entity:${params.entityType}`]);

  switch (params.entityType) {
    case "profile":
    case "site_settings":
    case "hero_content":
    case "about_content":
      paths.add("/about");
      paths.add("/contact");
      paths.add("/resume");
      break;
    case "project":
      paths.add("/projects");
      if (params.slug) {
        paths.add(`/projects/${params.slug}`);
        tags.add(`project:${params.slug}`);
      }
      break;
    case "note":
      paths.add("/notes");
      if (params.slug) {
        paths.add(`/notes/${params.slug}`);
        tags.add(`note:${params.slug}`);
      }
      break;
    case "skill_category":
    case "skill":
      paths.add("/about");
      paths.add("/resume");
      break;
    case "experience":
    case "education":
    case "certification":
      paths.add("/about");
      break;
    case "resume_file":
      paths.add("/resume");
      break;
    case "boot_greeting":
      break;
  }

  return {
    paths: Array.from(paths),
    tags: Array.from(tags),
  };
}

/**
 * Executes cache invalidation across all computed paths and tags.
 */
export function executeCacheRevalidation(
  plan: RevalidationPlan,
  executor: RevalidationExecutor = {
    revalidatePath: (p) => revalidatePath(p),
    revalidateTag: (t) => revalidateTag(t),
  },
): RevalidationPlan {
  for (const tag of plan.tags) {
    executor.revalidateTag(tag);
  }
  for (const path of plan.paths) {
    executor.revalidatePath(path);
  }
  return plan;
}
