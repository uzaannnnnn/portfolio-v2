export type StorageBucketName = "profile" | "projects" | "certificates";

export interface BucketPolicy {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export const INLINE_BUCKET_POLICIES: Record<StorageBucketName, BucketPolicy> = {
  profile: {
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".avif"],
  },
  projects: {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".avif"],
  },
  certificates: {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
  },
};

