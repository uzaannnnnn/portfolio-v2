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

export const profileDraftSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  professionalTitle: z.string().trim().min(2, "Professional title is required").max(100),
  tagline: z.string().trim().min(5, "Tagline is required").max(200),
  shortBio: z.string().trim().min(10, "Short bio is required").max(600),
  location: z.string().trim().max(100),
  email: z.string().trim().email("Invalid email").or(z.literal("")),
  githubUrl: z.string().trim().url("Invalid GitHub URL").or(z.literal("")),
  linkedinUrl: z.string().trim().url("Invalid LinkedIn URL").or(z.literal("")),
  websiteUrl: z.string().trim().url("Invalid Website URL").or(z.literal("")),
  avatarUrl: z.string().url().nullable(),
  availableForWork: z.boolean(),
  availabilityNote: z.string().trim().max(200),
});

export const heroDraftSchema = z.object({
  eyebrow: z.string().trim().min(2).max(100),
  headline: z.string().trim().min(5, "Headline is required").max(200),
  supportingDescription: z.string().trim().min(10).max(500),
  primaryCtaLabel: z.string().trim().min(2).max(60),
  primaryCtaHref: z.string().trim().min(1).max(200),
  secondaryCtaLabel: z.string().trim().min(2).max(60),
  secondaryCtaHref: z.string().trim().min(1).max(200),
  engineeringFocusAreas: z.array(z.string().trim().min(1)).min(1),
});

export const engineeringPillarSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(10).max(400),
  practices: z.array(z.string().trim().min(1)),
});

export const aboutDraftSchema = z.object({
  introduction: z.string().trim().min(10, "Introduction is required").max(500),
  narrativeParagraphs: z.array(z.string().trim().min(10)).min(1),
  engineeringPhilosophyTitle: z.string().trim().min(2).max(120),
  engineeringPhilosophySubtitle: z.string().trim().min(5).max(300),
  engineeringPillars: z.array(engineeringPillarSchema).min(1),
  coreDomains: z.array(z.string().trim().min(1)).min(1),
});

export const skillItemSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().trim().min(1, "Skill name is required").max(80),
  proficiency: z
    .enum(["Core", "Proficient", "Working Knowledge", "Exploring"])
    .optional(),
  isEnabled: z.boolean(),
  displayOrder: z.number().int().min(0),
  status: z.enum(["draft", "published", "archived"]),
});

export const skillCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Category name is required").max(80),
  slug: z.string().trim().min(2).max(80).regex(SLUG_REGEX),
  description: z.string().trim().max(300),
  displayOrder: z.number().int().min(0),
  isEnabled: z.boolean(),
  skills: z.array(skillItemSchema),
});

export const experienceDraftSchema = z.object({
  id: z.string().min(1),
  organization: z.string().trim().min(2, "Organization is required").max(120),
  role: z.string().trim().min(2, "Role is required").max(120),
  employmentType: z.enum([
    "Internship",
    "Full-time",
    "Part-time",
    "Freelance",
    "Contract",
  ]),
  workSystem: z.enum(["Onsite", "Remote", "Hybrid"]),
  location: z.string().trim().max(120),
  startMonth: z.number().int().min(1).max(12),
  startYear: z.number().int().min(1990).max(2100),
  endMonth: z.number().int().min(1).max(12).nullable(),
  endYear: z.number().int().min(1990).max(2100).nullable(),
  isCurrent: z.boolean(),
  description: z.string().trim().min(5).max(1000),
  responsibilities: z.array(z.string().trim().min(1)),
  technicalContributions: z.array(z.string().trim().min(1)),
  achievements: z.array(z.string().trim().min(1)),
  technologies: z.array(z.string().trim().min(1)),
  displayOrder: z.number().int().min(0),
  status: z.enum(["draft", "published", "archived"]),
});

export const educationDraftSchema = z.object({
  id: z.string().min(1),
  institution: z.string().trim().min(2, "Institution is required").max(160),
  degree: z.string().trim().min(2, "Degree is required").max(120),
  major: z.string().trim().min(2, "Major is required").max(120),
  startDate: z.string().trim().min(2).max(40),
  endDate: z.string().trim().max(40).nullable(),
  isCurrent: z.boolean(),
  gpa: z.string().trim().max(20).nullable(),
  thesisTitle: z.string().trim().max(300).nullable(),
  defenseGrade: z.string().trim().max(40).nullable(),
  description: z.string().trim().max(800).nullable(),
  displayOrder: z.number().int().min(0),
  status: z.enum(["draft", "published", "archived"]),
});

export const certificationDraftSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Certificate name is required").max(160),
  issuingOrganization: z.string().trim().min(2, "Issuing organization is required").max(160),
  issueMonth: z.number().int().min(1).max(12),
  issueYear: z.number().int().min(1990).max(2100),
  expirationMonth: z.number().int().min(1).max(12).nullable(),
  expirationYear: z.number().int().min(1990).max(2100).nullable(),
  credentialId: z.string().trim().max(120).nullable(),
  credentialUrl: z.string().trim().url().nullable(),
  certificateMediaUrl: z.string().trim().url().nullable(),
  description: z.string().trim().max(600).nullable(),
  displayOrder: z.number().int().min(0),
  status: z.enum(["draft", "published", "archived"]),
});

export const bootGreetingSchema = z.object({
  id: z.string().min(1),
  language: z.string().trim().min(2, "Language is required").max(80),
  greeting: z.string().trim().min(1, "Greeting is required").max(120),
  meaning: z.string().trim().min(1, "Meaning is required").max(120),
  isEnabled: z.boolean(),
  displayOrder: z.number().int().min(0),
  status: z.enum(["draft", "published", "archived"]),
});

export const siteSettingsDraftSchema = z.object({
  siteTitle: z.string().trim().min(3, "Site title is required").max(120),
  siteDescription: z.string().trim().min(10, "Site description is required").max(320),
  canonicalBaseUrl: z.string().trim().url("Canonical URL must be a valid URL"),
  homepageSectionOrder: z
    .array(
      z.enum([
        "hero",
        "about",
        "skills",
        "featured_projects",
        "experience",
        "philosophy",
        "education",
        "certifications",
        "contact",
      ]),
    )
    .min(1),
  bootWelcome: z.object({
    enabled: z.boolean(),
    intervalMs: z.number().int().min(800).max(5000),
    welcomeName: z.string().trim().min(2).max(100),
    welcomeTitle: z.string().trim().min(2).max(100),
    welcomeMessage: z.string().trim().min(2).max(200),
  }),
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
