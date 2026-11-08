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
 * Single-page portfolio routes are strictly "/" and "/sitemap.xml".
 */
export function buildCacheRevalidationPlan(params: {
  entityType: PublishableEntityType;
  slug?: string;
}): RevalidationPlan {
  const paths = new Set<string>(["/", "/sitemap.xml"]);
  const tags = new Set<string>(["portfolio-bundle", `entity:${params.entityType}`]);

  if (params.slug) {
    tags.add(`${params.entityType}:${params.slug}`);
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
