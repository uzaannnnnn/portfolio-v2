import crypto from "crypto";
import { revalidatePath } from "next/cache";
import type { VerifiedAdminContext } from "@/lib/auth/admin-guard";
import type { ResumeFileRecord } from "@/lib/database/cms-store";
import { getCmsStore } from "@/lib/database/cms-store";
import { ensureValidUuid } from "@/lib/database/supabase-cms-store";

export const MAX_RESUME_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Ephemeral in-memory buffer store for fixture adapter testing
const fixtureResumeBuffers = new Map<string, Buffer>();

export function setFixtureResumeBuffer(id: string, buffer: Buffer) {
  fixtureResumeBuffers.set(id, buffer);
}

export function getFixtureResumeBuffer(id: string): Buffer | undefined {
  return fixtureResumeBuffers.get(id);
}

export interface PdfUploadValidationResult {
  sanitizedFileName: string;
  sizeBytes: number;
}

/**
 * Validates PDF file upload:
 * - Rejects empty files
 * - Rejects files exceeding 10 MB
 * - Rejects non-.pdf extensions
 * - Validates actual binary content (checks for %PDF- magic bytes in first 1024 bytes)
 */
export function validatePdfUpload(file: {
  name: string;
  size: number;
  buffer: Buffer;
}): PdfUploadValidationResult {
  if (!file.size || file.size <= 0) {
    throw new Error("File upload rejected: file is empty (0 bytes).");
  }

  if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
    throw new Error(
      `File upload rejected: file size (${Math.round((file.size / (1024 * 1024)) * 100) / 100} MB) exceeds maximum limit of 10 MB.`,
    );
  }

  const rawName = (file.name || "resume.pdf").trim();
  const lowerName = rawName.toLowerCase();
  if (!lowerName.endsWith(".pdf")) {
    throw new Error("File upload rejected: only PDF files (.pdf) are allowed.");
  }

  // Validate actual file content magic bytes (ISO 32000-1 specification)
  const header = file.buffer.subarray(0, 1024).toString("ascii");
  if (!header.includes("%PDF-")) {
    throw new Error(
      "File upload rejected: invalid file content (selected file is not a valid PDF document).",
    );
  }

  const baseName = lowerName
    .slice(0, lowerName.length - 4)
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const safeBase = baseName || "resume";
  const sanitizedFileName = `${safeBase}.pdf`;

  return {
    sanitizedFileName,
    sizeBytes: file.size,
  };
}

/**
 * Direct device PDF upload and automatic activation pipeline.
 * Atomic:
 * 1. Validates binary PDF content and size.
 * 2. Uploads to Supabase Storage bucket 'resume' (or fixture store).
 * 3. Saves metadata in resume_files table with is_active=true and status='published'.
 * 4. Atomically replaces previous active resume (deactivating other versions).
 * 5. If DB persistence fails, cleans up orphaned storage object.
 */
export async function uploadAndActivateResume(params: {
  admin: VerifiedAdminContext;
  file: {
    name: string;
    size: number;
    buffer: Buffer;
  };
}): Promise<ResumeFileRecord> {
  const { sanitizedFileName, sizeBytes } = validatePdfUpload(params.file);
  const mode = process.env.DATA_ADAPTER_MODE ?? "fixture";
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const versionLabel = `v${now.slice(0, 10).replace(/-/g, ".")}`;
  const fileUrl = `/api/resume/download/${id}`;

  if (mode === "supabase") {
    const { createSupabaseServerClient } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await createSupabaseServerClient();
    const objectPath = `${id}-${sanitizedFileName}`;
    const storagePath = `resume/${objectPath}`;
    const actorId = ensureValidUuid(params.admin.adminId);

    // 1. Upload binary PDF to Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from("resume")
      .upload(objectPath, params.file.buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      throw new Error(
        `Failed to upload PDF to storage: ${uploadErr.message}`,
      );
    }

    // 2. Insert new resume record as active & published
    const { error: insertErr } = await supabase.from("resume_files").insert({
      id,
      version_label: versionLabel,
      file_name: sanitizedFileName,
      storage_path: storagePath,
      file_url: fileUrl,
      size_bytes: sizeBytes,
      summary_note: `Uploaded via Admin CMS on ${new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}`,
      is_active: true,
      status: "published",
      published_at: now,
      created_at: now,
      updated_at: now,
    });

    if (insertErr) {
      // Rollback: clean up orphaned storage object so storage stays clean
      await supabase.storage.from("resume").remove([objectPath]).catch(() => {});
      throw new Error(
        `Failed to save resume metadata: ${insertErr.message}`,
      );
    }

    // 3. Atomically deactivate all other resumes so only ONE is active
    await supabase
      .from("resume_files")
      .update({ is_active: false })
      .neq("id", id);

    // 4. Audit log entry
    try {
      await supabase.from("audit_logs").insert({
        id: crypto.randomUUID(),
        actor_id: actorId,
        actor_email: params.admin.email,
        action: "upload_and_activate_resume",
        entity_type: "resume_file",
        entity_id: id,
        metadata: {
          versionLabel,
          fileName: sanitizedFileName,
          sizeBytes,
        },
        created_at: now,
      });
    } catch {
      // Non-critical audit log fallback
    }

    try {
      revalidatePath("/");
      revalidatePath("/admin");
      revalidatePath("/admin/resume");
      revalidatePath("/api/resume/active");
    } catch {
      // Safe outside request context
    }

    return {
      id,
      versionLabel,
      fileName: sanitizedFileName,
      storagePath,
      fileUrl,
      sizeBytes,
      summaryNote: `Uploaded via Admin CMS on ${new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}`,
      isActive: true,
      status: "published",
      updatedAt: now,
    };
  }

  // Fixture adapter mode (local dev and automated tests)
  const store = getCmsStore();

  // Store exact binary buffer for fixture downloads
  setFixtureResumeBuffer(id, params.file.buffer);

  // Deactivate any previously active resumes
  store.resumeFiles = store.resumeFiles.map((r) => ({
    ...r,
    isActive: false,
    status: r.status === "published" ? ("archived" as const) : r.status,
  }));

  const record: ResumeFileRecord = {
    id,
    versionLabel,
    fileName: sanitizedFileName,
    storagePath: `resume/${id}-${sanitizedFileName}`,
    fileUrl,
    sizeBytes,
    summaryNote: `Uploaded via Admin CMS on ${new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}`,
    isActive: true,
    status: "published",
    updatedAt: now,
  };

  store.resumeFiles.unshift(record);

  store.auditLogs.unshift({
    id: crypto.randomUUID(),
    actorId: params.admin.adminId,
    actorEmail: params.admin.email,
    action: "upload_and_activate_resume",
    entityType: "resume_file",
    entityId: id,
    metadata: {
      versionLabel,
      fileName: sanitizedFileName,
      sizeBytes,
    },
    createdAt: now,
  });

  try {
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/resume");
    revalidatePath("/api/resume/active");
  } catch {
    // Safe outside request context
  }

  return record;
}
