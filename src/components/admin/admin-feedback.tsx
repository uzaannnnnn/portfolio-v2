"use client";

import { useEffect, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Globe } from "lucide-react";
import type { LanguageCompleteness } from "@/lib/i18n/localization";
import type { LanguagePreference } from "@/types/portfolio";

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
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      data-testid="admin-confirm-dialog"
    >
      <div className="w-full max-w-md rounded-xl border border-border-token bg-background p-6">
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold text-foreground"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-desc"
          className="mt-2 text-xs leading-relaxed text-secondary-foreground"
        >
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

export function AdminLanguageTabs({
  activeLanguage,
  onSelectLanguage,
  completeness,
  testIdPrefix = "cms",
}: {
  activeLanguage: LanguagePreference;
  onSelectLanguage: (lang: LanguagePreference) => void;
  completeness: LanguageCompleteness;
  testIdPrefix?: string;
}) {
  return (
    <div
      data-testid={`${testIdPrefix}-language-bar`}
      className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-token bg-surface/60 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div
          role="tablist"
          aria-label="Content authoring language"
          data-testid="cms-language-tabs"
          className="inline-flex items-center rounded-lg border border-border-token bg-background p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeLanguage === "en"}
            data-testid="cms-lang-tab-en"
            onClick={() => onSelectLanguage("en")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeLanguage === "en"
                ? "bg-foreground text-background shadow-sm"
                : "text-secondary-foreground hover:text-foreground"
            }`}
          >
            English
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeLanguage === "id"}
            data-testid="cms-lang-tab-id"
            onClick={() => onSelectLanguage("id")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeLanguage === "id"
                ? "bg-foreground text-background shadow-sm"
                : "text-secondary-foreground hover:text-foreground"
            }`}
          >
            Indonesia
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span data-testid="cms-active-language-indicator">
            Editing:{" "}
            <strong className="font-semibold text-foreground">
              {activeLanguage === "en"
                ? "English (Primary — Required)"
                : "Bahasa Indonesia (Manual — Optional)"}
            </strong>
          </span>
        </div>
      </div>

      <div
        data-testid="cms-completeness-status"
        className="flex flex-wrap items-center gap-2 text-[11px] font-medium"
      >
        <span
          data-testid="cms-en-completeness-badge"
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 ${
            completeness.enComplete
              ? "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-amber-300 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }`}
        >
          {completeness.enLabel} ({completeness.filledEnCount}/{completeness.totalEnCount})
        </span>
        <span
          data-testid="cms-id-completeness-badge"
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 ${
            completeness.idComplete
              ? "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-border-token bg-background text-muted-foreground"
          }`}
        >
          {completeness.idLabel} ({completeness.filledIdCount}/{completeness.totalIdCount})
        </span>
      </div>
    </div>
  );
}

export function AdminCompletenessPills({
  completeness,
}: {
  completeness: LanguageCompleteness;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono">
      <span
        title={completeness.enLabel}
        className={`rounded px-1.5 py-0.5 ${
          completeness.enComplete
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        }`}
      >
        EN {completeness.enComplete ? "✓" : "!"}
      </span>
      <span
        title={`${completeness.idLabel} (${completeness.filledIdCount}/${completeness.totalIdCount})`}
        className={`rounded px-1.5 py-0.5 ${
          completeness.idComplete
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "bg-surface text-muted-foreground border border-border-token"
        }`}
      >
        ID {completeness.idComplete ? "✓" : `${completeness.filledIdCount}/${completeness.totalIdCount}`}
      </span>
    </span>
  );
}
