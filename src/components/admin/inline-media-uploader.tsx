"use client";

import { useRef, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  INLINE_BUCKET_POLICIES,
  type StorageBucketName,
} from "@/lib/media/types";

interface InlineMediaUploaderProps {
  bucket: StorageBucketName;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  helperText?: string;
  testIdPrefix?: string;
}

export function InlineMediaUploader({
  bucket,
  value,
  onChange,
  label,
  helperText,
  testIdPrefix = "inline-media",
}: InlineMediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const policy = INLINE_BUCKET_POLICIES[bucket];
  const accept = policy?.allowedExtensions.join(",") || "image/*";
  const limitMb = policy ? Math.round(policy.maxSizeBytes / (1024 * 1024)) : 10;

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = "";
    setErrorMessage(null);

    // Client-side size check
    if (file.size > policy.maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(
        `Selected file (${sizeMb} MB) exceeds maximum limit of ${limitMb} MB for ${bucket}.`,
      );
      return;
    }

    // Client-side extension check
    const lowerName = file.name.toLowerCase();
    const hasValidExt = policy.allowedExtensions.some((ext) =>
      lowerName.endsWith(ext),
    );
    if (!hasValidExt) {
      setErrorMessage(
        `File extension not permitted. Allowed extensions: ${policy.allowedExtensions.join(", ")}.`,
      );
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to upload file.");
      }

      onChange(data.data.publicUrl);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  const isPdf =
    typeof value === "string" &&
    (value.toLowerCase().includes(".pdf") || bucket === "certificates" && value.endsWith(".pdf"));

  return (
    <div className="space-y-2" data-testid={`${testIdPrefix}-container`}>
      {label && (
        <label className="block text-xs font-medium text-foreground">
          {label}
        </label>
      )}

      {/* Hidden file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelected}
        className="hidden"
        data-testid={`${testIdPrefix}-file-input`}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400"
          data-testid={`${testIdPrefix}-error`}
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-2 hover:opacity-75"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Uploading State */}
      {isUploading ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-border-token bg-surface p-4 text-xs text-secondary-foreground"
          data-testid={`${testIdPrefix}-uploading`}
        >
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span>Uploading asset to {bucket} storage...</span>
        </div>
      ) : value ? (
        /* Preview & Actions State */
        <div
          className="flex flex-wrap items-center gap-4 rounded-lg border border-border-token bg-surface p-3"
          data-testid={`${testIdPrefix}-preview-card`}
        >
          {isPdf ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border-token bg-background text-accent">
              <FileText className="h-8 w-8" />
            </div>
          ) : (
            <div className="relative h-16 w-16 overflow-hidden rounded-md border border-border-token bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Uploaded asset preview"
                className="h-full w-full object-cover"
                data-testid={`${testIdPrefix}-image-preview`}
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[11px] text-foreground">
              {value}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isPdf ? "PDF Document" : "Image Asset"} in {bucket} bucket
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                data-testid={`${testIdPrefix}-replace-btn`}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Replace
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(null)}
                className="text-red-600 hover:border-red-600 hover:text-red-700"
                data-testid={`${testIdPrefix}-remove-btn`}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Trigger */
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-token bg-surface/50 p-6 text-center hover:bg-surface/80"
          data-testid={`${testIdPrefix}-empty`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-secondary-foreground">
            {bucket === "certificates" ? (
              <FileText className="h-5 w-5" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
          </div>
          <p className="mt-2 text-xs font-medium text-foreground">
            No file uploaded yet
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {helperText || `Upload ${accept} up to ${limitMb} MB directly from device`}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3"
            data-testid={`${testIdPrefix}-choose-btn`}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Choose File from Device
          </Button>
        </div>
      )}
    </div>
  );
}

interface InlineGalleryUploaderProps {
  bucket: "projects";
  items: { url: string; alt: string }[];
  onChange: (items: { url: string; alt: string }[]) => void;
  label?: string;
  testIdPrefix?: string;
}

export function InlineGalleryUploader({
  bucket,
  items,
  onChange,
  label = "Project Screenshots Gallery",
  testIdPrefix = "inline-gallery",
}: InlineGalleryUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const policy = INLINE_BUCKET_POLICIES[bucket];
  const accept = policy?.allowedExtensions.join(",") || "image/*";

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    setErrorMessage(null);

    if (file.size > policy.maxSizeBytes) {
      setErrorMessage("File exceeds 10 MB limit.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to upload screenshot.");
      }

      const newShot = {
        url: data.data.publicUrl,
        alt: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      };

      onChange([...items, newShot]);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to upload screenshot.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemove(index: number) {
    const next = [...items];
    next.splice(index, 1);
    onChange(next);
  }

  function handleAltChange(index: number, newAlt: string) {
    const next = [...items];
    if (next[index]) {
      next[index] = { ...next[index]!, alt: newAlt };
      onChange(next);
    }
  }

  return (
    <div className="space-y-3" data-testid={`${testIdPrefix}-container`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-foreground">
          {label} ({items.length})
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          data-testid={`${testIdPrefix}-add-btn`}
        >
          {isUploading ? (
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
          ) : (
            <Plus className="mr-1.5 h-3 w-3" />
          )}
          Add Screenshot
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelected}
        className="hidden"
        data-testid={`${testIdPrefix}-file-input`}
      />

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="hover:opacity-75"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-token p-4 text-center text-xs text-muted-foreground">
          No screenshots added yet. Click &ldquo;Add Screenshot&rdquo; to upload directly from device.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item, idx) => (
            <div
              key={item.url + idx}
              className="flex items-center gap-3 rounded-lg border border-border-token bg-surface p-2.5"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-border-token bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.alt || "Screenshot preview"}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  value={item.alt}
                  placeholder="Screenshot alt text / caption"
                  onChange={(e) => handleAltChange(idx, e.target.value)}
                  className="w-full rounded border border-border-token bg-background px-2 py-1 text-xs text-foreground"
                />
                <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                  {item.url}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-secondary-foreground hover:text-red-600"
                aria-label="Remove screenshot"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
