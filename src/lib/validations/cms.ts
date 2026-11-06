import { z } from "zod";
import type { StorageBucketName } from "@/types/database";

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const caseStudySectionSchema = z.object({
  id: z.string().min(1),
  sectionType: z.enum([
    "overview",
    "problem",
    "objectives",
    "solution",
    "architecture",
    "implementation",
    "database",
    "api",
    "challenges",
    "tradeoffs",
    "testing",
    "deployment",
    "results",
    "lessons",
  ]),
  title: z.string().trim().min(1, "Section title is required"),
  content: z.string().trim(),
  displayOrder: z.number().int().min(0),
  isEnabled: z.boolean(),
});

export const projectDraftSchema = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(SLUG_REGEX, "Slug must be lowercase kebab-case"),
  name: z.string().trim().min(2, "Project name is required").max(120),
  description: z
    .string()
    .trim()
    .min(10, "Project description must be at least 10 characters")
    .max(500),
  category: z.string().trim().min(2, "Category is required").max(80),
  technologies: z.array(z.string().trim().min(1)).min(1, "At least one technology is required"),
  coverUrl: z.string().url().nullable(),
  githubUrl: z.string().url().nullable(),
  liveDemoUrl: z.string().url().nullable(),
  projectCompletionState: z.string().trim().min(2).max(120),
  status: z.enum(["draft", "published", "archived"]),
  isFeatured: z.boolean(),
  displayOrder: z.number().int().min(0),
  updatedAt: z.string().min(1),
  screenshots: z.array(
    z.object({
      url: z.string().url(),
      alt: z.string().trim().min(1),
    }),
  ),
  caseStudySections: z.array(caseStudySectionSchema),
});

/**
 * Stricter validation required before a project can transition from Draft to Published.
 * Prevents accidental publication of incomplete content.
 */
export const projectPublishValidationSchema = projectDraftSchema.refine(
  (project) =>
    project.caseStudySections.some(
      (section) => section.isEnabled && section.content.trim().length >= 20,
    ),
  {
    message:
      "Cannot publish project: at least one enabled case study section with substantive content (>= 20 chars) is required.",
    path: ["caseStudySections"],
  },
);

export const noteDraftSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().min(2).max(120).regex(SLUG_REGEX),
  summary: z.string().trim().min(10).max(400),
  contentMdx: z.string().trim().min(20),
  coverImageUrl: z.string().url().nullable(),
  category: z.string().trim().min(2).max(80),
  tags: z.array(z.string().trim().min(1)),
  publishedAt: z.string().nullable(),
  seoTitle: z.string().trim().max(160).nullable(),
  seoDescription: z.string().trim().max(300).nullable(),
  status: z.enum(["draft", "published", "archived"]),
});

export interface BucketUploadPolicy {
  bucket: StorageBucketName;
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
  isPublicByDefault: boolean;
}

export const STORAGE_BUCKET_POLICIES: Record<StorageBucketName, BucketUploadPolicy> = {
  profile: {
    bucket: "profile",
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".avif"],
    isPublicByDefault: true,
  },
  projects: {
    bucket: "projects",
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".avif"],
    isPublicByDefault: true,
  },
  certificates: {
    bucket: "certificates",
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
    isPublicByDefault: true,
  },
  resume: {
    bucket: "resume",
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ["application/pdf"],
    allowedExtensions: [".pdf"],
    isPublicByDefault: false, // Strictly private unless active & published
  },
  articles: {
    bucket: "articles",
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".avif"],
    isPublicByDefault: true,
  },
  "og-images": {
    bucket: "og-images",
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    isPublicByDefault: true,
  },
};

export interface FileUploadCandidate {
  bucket: StorageBucketName;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  altText?: string;
}

export interface ValidatedStorageUpload {
  bucket: StorageBucketName;
  sanitizedFileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  isPublic: boolean;
}

/**
 * Validates file upload metadata (bucket, MIME type, file extension, size limits, and path traversal safety).
 * Never trusts file extensions alone: both MIME type and extension must match the bucket policy.
 */
export function validateMediaUpload(
  candidate: FileUploadCandidate,
): ValidatedStorageUpload {
  const policy = STORAGE_BUCKET_POLICIES[candidate.bucket];
  if (!policy) {
    throw new Error(`Unsupported storage bucket: "${candidate.bucket}".`);
  }

  if (candidate.sizeBytes <= 0) {
    throw new Error("File upload rejected: file is empty (0 bytes).");
  }

  if (candidate.sizeBytes > policy.maxSizeBytes) {
    throw new Error(
      `File upload rejected: file size (${candidate.sizeBytes} bytes) exceeds bucket limit (${policy.maxSizeBytes} bytes).`,
    );
  }

  const normalizedMime = candidate.mimeType.trim().toLowerCase();
  if (!policy.allowedMimeTypes.includes(normalizedMime)) {
    throw new Error(
      `File upload rejected: MIME type "${normalizedMime}" is not allowed in bucket "${candidate.bucket}".`,
    );
  }

  const trimmedName = candidate.fileName.trim();
  if (!trimmedName || trimmedName.includes("..") || trimmedName.includes("/") || trimmedName.includes("\\")) {
    throw new Error("File upload rejected: invalid or unsafe file name.");
  }

  const lowerName = trimmedName.toLowerCase();
  const matchedExt = policy.allowedExtensions.find((ext) =>
    lowerName.endsWith(ext),
  );
  if (!matchedExt) {
    throw new Error(
      `File upload rejected: file extension of "${trimmedName}" does not match allowed extensions (${policy.allowedExtensions.join(", ")}) for bucket "${candidate.bucket}".`,
    );
  }

  const baseName = lowerName
    .slice(0, lowerName.length - matchedExt.length)
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const safeBase = baseName || "asset";
  const sanitizedFileName = `${safeBase}${matchedExt}`;
  const storagePath = `${candidate.bucket}/${sanitizedFileName}`;

  return {
    bucket: candidate.bucket,
    sanitizedFileName,
    storagePath,
    mimeType: normalizedMime,
    sizeBytes: candidate.sizeBytes,
    altText: (candidate.altText ?? "").trim(),
    isPublic: policy.isPublicByDefault,
  };
}
