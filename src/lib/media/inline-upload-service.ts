import crypto from "crypto";
import type { VerifiedAdminContext } from "@/lib/auth/admin-guard";
import { getCmsStore } from "@/lib/database/cms-store";
import { ensureValidUuid } from "@/lib/database/supabase-cms-store";
import {
  INLINE_BUCKET_POLICIES,
  type StorageBucketName,
  type BucketPolicy,
} from "@/lib/media/types";

export {
  INLINE_BUCKET_POLICIES,
  type StorageBucketName,
  type BucketPolicy,
};

/**
 * Validates actual binary content magic bytes.
 * Prevents file extension spoofing (e.g., .exe renamed to .png).
 */
export function validateMagicBytes(buffer: Buffer, mimeType: string, fileName: string): void {
  const lowerName = fileName.toLowerCase();

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    const header = buffer.subarray(0, 1024).toString("ascii");
    if (!header.includes("%PDF-")) {
      throw new Error("File content is not a valid PDF document.");
    }
    return;
  }

  if (
    mimeType === "image/png" ||
    lowerName.endsWith(".png")
  ) {
    if (
      buffer.length < 8 ||
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e ||
      buffer[3] !== 0x47 ||
      buffer[4] !== 0x0d ||
      buffer[5] !== 0x0a ||
      buffer[6] !== 0x1a ||
      buffer[7] !== 0x0a
    ) {
      throw new Error("File content is not a valid PNG image.");
    }
    return;
  }

  if (
    mimeType === "image/jpeg" ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg")
  ) {
    if (
      buffer.length < 3 ||
      buffer[0] !== 0xff ||
      buffer[1] !== 0xd8 ||
      buffer[2] !== 0xff
    ) {
      throw new Error("File content is not a valid JPEG image.");
    }
    return;
  }

  if (
    mimeType === "image/webp" ||
    lowerName.endsWith(".webp")
  ) {
    if (buffer.length < 12) {
      throw new Error("File content is too small to be a valid WebP image.");
    }
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webp = buffer.subarray(8, 12).toString("ascii");
    if (riff !== "RIFF" || webp !== "WEBP") {
      throw new Error("File content is not a valid WebP image.");
    }
    return;
  }

  if (
    mimeType === "image/avif" ||
    lowerName.endsWith(".avif")
  ) {
    if (buffer.length < 12) {
      throw new Error("File content is too small to be a valid AVIF image.");
    }
    const ftyp = buffer.subarray(4, 8).toString("ascii");
    if (ftyp !== "ftyp") {
      throw new Error("File content is not a valid AVIF image.");
    }
  }
}

export interface InlineUploadValidationResult {
  bucket: StorageBucketName;
  sanitizedFileName: string;
  mimeType: string;
  sizeBytes: number;
}

export function validateInlineUpload(params: {
  bucket: string;
  fileName: string;
  sizeBytes: number;
  mimeType?: string;
  buffer: Buffer;
}): InlineUploadValidationResult {
  const bucketKey = params.bucket as StorageBucketName;
  const policy = INLINE_BUCKET_POLICIES[bucketKey];

  if (!policy) {
    throw new Error(
      `Unsupported storage bucket "${params.bucket}". Allowed buckets: profile, projects, certificates.`,
    );
  }

  if (!params.sizeBytes || params.sizeBytes <= 0) {
    throw new Error("File upload rejected: file is empty (0 bytes).");
  }

  if (params.sizeBytes > policy.maxSizeBytes) {
    const limitMb = Math.round((policy.maxSizeBytes / (1024 * 1024)) * 100) / 100;
    const currentMb = Math.round((params.sizeBytes / (1024 * 1024)) * 100) / 100;
    throw new Error(
      `File upload rejected: file size (${currentMb} MB) exceeds maximum limit of ${limitMb} MB for ${params.bucket}.`,
    );
  }

  const rawName = (params.fileName || "asset").trim();
  if (
    !rawName ||
    rawName.includes("..") ||
    rawName.includes("/") ||
    rawName.includes("\\")
  ) {
    throw new Error("File upload rejected: invalid or unsafe file name.");
  }

  const lowerName = rawName.toLowerCase();
  const matchedExt = policy.allowedExtensions.find((ext) => lowerName.endsWith(ext));
  if (!matchedExt) {
    throw new Error(
      `File upload rejected: file extension for "${rawName}" is not permitted. Allowed: ${policy.allowedExtensions.join(", ")}.`,
    );
  }

  // Derive normalized MIME
  let mimeType = (params.mimeType || "").trim().toLowerCase();
  if (!mimeType || mimeType === "application/octet-stream") {
    if (matchedExt === ".pdf") mimeType = "application/pdf";
    else if (matchedExt === ".png") mimeType = "image/png";
    else if (matchedExt === ".jpg" || matchedExt === ".jpeg") mimeType = "image/jpeg";
    else if (matchedExt === ".webp") mimeType = "image/webp";
    else if (matchedExt === ".avif") mimeType = "image/avif";
  }

  if (!policy.allowedMimeTypes.includes(mimeType)) {
    throw new Error(
      `File upload rejected: MIME type "${mimeType}" is not allowed in bucket "${params.bucket}".`,
    );
  }

  // Validate actual binary contents
  validateMagicBytes(params.buffer, mimeType, rawName);

  const baseName = lowerName
    .slice(0, lowerName.length - matchedExt.length)
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const safeBase = baseName || "asset";
  const sanitizedFileName = `${safeBase}${matchedExt}`;

  return {
    bucket: bucketKey,
    sanitizedFileName,
    mimeType,
    sizeBytes: params.sizeBytes,
  };
}

export interface InlineUploadResult {
  id: string;
  bucket: StorageBucketName;
  storagePath: string;
  publicUrl: string;
  fileName: string;
  sizeBytes: number;
}

/**
 * Reusable inline upload handler across Profile, Projects, Experience, and Certifications.
 * - Authenticated on server.
 * - Validates file size, extension, MIME, and binary magic bytes.
 * - Streams to Supabase Storage bucket (or caches in fixture store).
 * - Returns clean public storage URL and metadata.
 */
export async function uploadInlineMediaFile(params: {
  admin: VerifiedAdminContext;
  bucket: string;
  file: {
    name: string;
    size: number;
    mimeType?: string;
    buffer: Buffer;
  };
}): Promise<InlineUploadResult> {
  const validated = validateInlineUpload({
    bucket: params.bucket,
    fileName: params.file.name,
    sizeBytes: params.file.size,
    mimeType: params.file.mimeType,
    buffer: params.file.buffer,
  });

  const mode = process.env.DATA_ADAPTER_MODE ?? "fixture";
  const id = crypto.randomUUID();
  const objectPath = `${id}-${validated.sanitizedFileName}`;
  const storagePath = `${validated.bucket}/${objectPath}`;

  if (mode === "supabase") {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await createSupabaseServerClient();
    const actorId = ensureValidUuid(params.admin.adminId);

    const { error: uploadErr } = await supabase.storage
      .from(validated.bucket)
      .upload(objectPath, params.file.buffer, {
        contentType: validated.mimeType,
        upsert: true,
      });

    if (uploadErr) {
      throw new Error(`Failed to upload file to storage bucket: ${uploadErr.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(validated.bucket)
      .getPublicUrl(objectPath);

    const publicUrl =
      urlData?.publicUrl ||
      `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/${storagePath}`;

    // Record in media_assets table if present
    try {
      await supabase.from("media_assets").insert({
        id,
        bucket: validated.bucket,
        storage_path: storagePath,
        public_url: publicUrl,
        file_name: validated.sanitizedFileName,
        mime_type: validated.mimeType,
        size_bytes: validated.sizeBytes,
        alt_text: validated.sanitizedFileName,
        is_public: true,
        created_by: actorId,
      });
    } catch {
      // Non-fatal if table is being deprecated
    }

    return {
      id,
      bucket: validated.bucket,
      storagePath,
      publicUrl,
      fileName: validated.sanitizedFileName,
      sizeBytes: validated.sizeBytes,
    };
  }

  // Fixture Mode
  const publicUrl = `/storage/mock/${validated.bucket}/${objectPath}`;
  const store = getCmsStore();
  store.mediaAssets.push({
    id,
    bucket: validated.bucket,
    storagePath,
    publicUrl,
    fileName: validated.sanitizedFileName,
    mimeType: validated.mimeType,
    sizeBytes: validated.sizeBytes,
    altText: validated.sanitizedFileName,
    isPublic: true,
    createdAt: new Date().toISOString(),
  });

  return {
    id,
    bucket: validated.bucket,
    storagePath,
    publicUrl,
    fileName: validated.sanitizedFileName,
    sizeBytes: validated.sizeBytes,
  };
}
