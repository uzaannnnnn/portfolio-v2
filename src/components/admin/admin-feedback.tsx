"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function AdminStatusBanner({
  status,
  onDismiss,
}: {
  status: { ok: boolean; message: string } | null;
  onDismiss?: () => void;
}) {
  if (!status) return null;

  return (
    <div
      role="status"
      data-testid={status.ok ? "admin-toast-success" : "admin-toast-error"}
      className={`mb-6 flex items-center justify-between gap-3 rounded-lg border p-3.5 text-xs ${
        status.ok
          ? "border-emerald-300 bg-emerald-50/90 text-emerald-950"
          : "border-red-300 bg-red-50/90 text-red-950"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {status.ok ? (
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-emerald-700"
            aria-hidden="true"
          />
        ) : (
          <AlertCircle
            className="h-4 w-4 shrink-0 text-red-600"
            aria-hidden="true"
          />
        )}
        <span className="font-medium">{status.message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="font-mono text-[11px] underline opacity-80 hover:opacity-100"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      data-testid="admin-confirm-dialog"
    >
      <div className="w-full max-w-md rounded-xl border border-border-token bg-background p-6">
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold text-foreground"
        >
          {title}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-secondary-foreground">
          {description}
        </p>
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border-token bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground hover:border-border-strong"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            data-testid="admin-confirm-delete-btn"
            className="rounded-md bg-red-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border-token pb-5">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
          {eyebrow}
        </span>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-xs text-secondary-foreground">
          {description}
        </p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
