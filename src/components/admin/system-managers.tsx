"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  FileText,
  FileUp,
  History,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  deleteBootGreetingAction,
  deleteResumeVersionAction,
  publishSiteSettingsAction,
  saveBootGreetingAction,
  saveSiteSettingsDraftAction,
} from "@/features/admin/actions";
import type {
  AuditLogEntry,
  PublicationRecord,
  RevisionRecord,
  VersionedEntityRecord,
} from "@/features/publishing/publishing-engine";
import type { ResumeFileRecord } from "@/lib/database/cms-store";
import type { BootGreeting, LanguagePreference, SiteSettings } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminCompletenessPills,
  AdminConfirmDialog,
  AdminLanguageTabs,
  AdminPageHeader,
  AdminStatusBanner,
} from "@/components/admin/admin-feedback";
import {
  buildCompleteness,
  getBootGreetingCompleteness,
  getSiteSettingsCompleteness,
  hasText,
} from "@/lib/i18n/localization";

export function BootExperienceManager({
  greetings,
  siteSettingsEntity,
}: {
  greetings: BootGreeting[];
  siteSettingsEntity: VersionedEntityRecord<SiteSettings>;
}) {
  const router = useRouter();
  const [welcomeForm, setWelcomeForm] = useState(siteSettingsEntity.draftData.bootWelcome);
  const [activeLanguage, setActiveLanguage] = useState<LanguagePreference>("en");

  const welcomeCompleteness = buildCompleteness(
    [
      hasText(welcomeForm.welcomeTitle),
      hasText(welcomeForm.welcomeMessage),
    ],
    [
      hasText(welcomeForm.welcomeTitleId),
      hasText(welcomeForm.welcomeMessageId),
    ],
  );
  const [newGreeting, setNewGreeting] = useState<BootGreeting>({
    id: `greet-${Date.now()}`,
    language: "",
    greeting: "",
    meaning: "Welcome",
    meaningId: "Selamat Datang",
    regionNote: "",
    regionNoteId: "",
    isEnabled: true,
    displayOrder: greetings.length + 1,
    status: "published",
  });
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSaveWelcomeConfig() {
    setBusy(true);
    const updatedSettings: SiteSettings = {
      ...siteSettingsEntity.draftData,
      bootWelcome: welcomeForm,
    };
    const saved = await saveSiteSettingsDraftAction(
      updatedSettings,
      "Updated Indonesian boot welcome config",
    );
    if (saved.ok) {
      await publishSiteSettingsAction("Published Indonesian boot welcome config");
    }
    setBusy(false);
    setStatus({ ok: saved.ok, message: saved.message });
    router.refresh();
  }

  async function handleToggleGreeting(g: BootGreeting) {
    setBusy(true);
    const res = await saveBootGreetingAction({
      ...g,
      isEnabled: !g.isEnabled,
    });
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handleAddGreeting() {
    setBusy(true);
    const res = await saveBootGreetingAction({
      ...newGreeting,
      id: `greet-${Date.now()}`,
      displayOrder: greetings.length + 1,
    });
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    if (res.ok) {
      setNewGreeting({
        id: `greet-${Date.now()}`,
        language: "",
        greeting: "",
        meaning: "Welcome",
        regionNote: "",
        isEnabled: true,
        displayOrder: greetings.length + 2,
        status: "published",
      });
      router.refresh();
    }
  }

  async function handleDeleteGreeting(id: string) {
    setBusy(true);
    const res = await deleteBootGreetingAction(id);
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  return (
    <div data-testid="admin-boot-experience-manager">
      <AdminPageHeader
        eyebrow="Experience & Settings"
        title="Indonesian Regional Boot Experience"
        description="Manage the first-visit Indonesian regional greetings sequence, rotation timing, and welcome screen copy."
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Welcome Screen Configuration */}
        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-foreground">Welcome Screen Configuration</h2>
            <AdminLanguageTabs
              activeLanguage={activeLanguage}
              onSelectLanguage={setActiveLanguage}
              completeness={welcomeCompleteness}
              testIdPrefix="boot-welcome"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={welcomeForm.enabled}
              onChange={(e) => setWelcomeForm({ ...welcomeForm, enabled: e.target.checked })}
            />
            <span>Enable First-Visit Boot Experience</span>
          </label>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Rotation Interval (ms)
            </label>
            <input
              type="number"
              min={800}
              max={5000}
              value={welcomeForm.intervalMs}
              onChange={(e) =>
                setWelcomeForm({
                  ...welcomeForm,
                  intervalMs: Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-1.5 font-mono text-xs text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en" ? "Welcome Title (EN)" : "Welcome Title (ID)"}
            </label>
            {activeLanguage === "en" ? (
              <input
                type="text"
                data-testid="boot-welcome-title-en-input"
                value={welcomeForm.welcomeTitle ?? ""}
                onChange={(e) =>
                  setWelcomeForm({
                    ...welcomeForm,
                    welcomeTitle: e.target.value,
                  })
                }
                placeholder="Welcome to my engineering portfolio"
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
              />
            ) : (
              <input
                type="text"
                data-testid="boot-welcome-title-id-input"
                value={welcomeForm.welcomeTitleId ?? ""}
                onChange={(e) =>
                  setWelcomeForm({
                    ...welcomeForm,
                    welcomeTitleId: e.target.value,
                  })
                }
                placeholder={welcomeForm.welcomeTitle || "Selamat datang di portofolio rekayasa saya"}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en" ? "Welcome Message (EN)" : "Welcome Message (ID)"}
            </label>
            {activeLanguage === "en" ? (
              <input
                type="text"
                data-testid="boot-welcome-msg-en-input"
                value={welcomeForm.welcomeMessage}
                onChange={(e) =>
                  setWelcomeForm({
                    ...welcomeForm,
                    welcomeMessage: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
              />
            ) : (
              <input
                type="text"
                data-testid="boot-welcome-msg-id-input"
                value={welcomeForm.welcomeMessageId ?? ""}
                placeholder={welcomeForm.welcomeMessage || "Pesan sambutan dalam Bahasa Indonesia"}
                onChange={(e) =>
                  setWelcomeForm({
                    ...welcomeForm,
                    welcomeMessageId: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
              />
            )}
          </div>

          <Button type="button" size="sm" disabled={busy} onClick={handleSaveWelcomeConfig}>
            Save & Publish Boot Config
          </Button>
        </div>

        {/* Regional Greetings Table & Add Form */}
        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">
            Regional Greetings ({greetings.length})
          </h2>

          <div className="grid gap-2 sm:grid-cols-6">
            <input
              type="text"
              placeholder="Language (e.g., Sundanese)"
              value={newGreeting.language}
              onChange={(e) => setNewGreeting({ ...newGreeting, language: e.target.value })}
              className="rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
            />
            <input
              type="text"
              placeholder="Greeting phrase"
              value={newGreeting.greeting}
              onChange={(e) => setNewGreeting({ ...newGreeting, greeting: e.target.value })}
              className="rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
            />
            <input
              type="text"
              placeholder="Meaning EN"
              value={newGreeting.meaning}
              onChange={(e) => setNewGreeting({ ...newGreeting, meaning: e.target.value })}
              className="rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
            />
            <input
              type="text"
              placeholder="Meaning ID"
              value={newGreeting.meaningId ?? ""}
              onChange={(e) => setNewGreeting({ ...newGreeting, meaningId: e.target.value })}
              className="rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
            />
            <input
              type="text"
              placeholder="Region EN"
              value={newGreeting.regionNote ?? ""}
              onChange={(e) => setNewGreeting({ ...newGreeting, regionNote: e.target.value })}
              className="rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={handleAddGreeting}
            >
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Add Greeting
            </Button>
          </div>

          <div className="divide-y divide-border-token rounded-lg border border-border-token">
            {greetings.map((g) => (
              <div
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-accent">
                      #{g.displayOrder} · {g.language}
                      {g.regionNote && g.regionNote.trim().length > 0 && (
                        <span className="text-secondary-foreground"> · [{g.regionNote}]</span>
                      )}
                    </span>
                    <AdminCompletenessPills
                      completeness={getBootGreetingCompleteness(g)}
                    />
                  </div>
                  <p className="font-semibold text-foreground">{g.greeting}</p>
                  <p className="text-[11px] text-secondary-foreground">
                    EN: &ldquo;{g.meaning}&rdquo;
                    {g.meaningId && ` · ID: "${g.meaningId}"`}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleToggleGreeting(g)}
                    className="rounded border border-border-token bg-surface px-2.5 py-1 font-mono text-[11px]"
                  >
                    {g.isEnabled ? "Enabled" : "Disabled"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGreeting(g.id)}
                    aria-label={`Delete ${g.language}`}
                    className="text-muted-foreground hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ResumeManager({ resumes }: { resumes: ResumeFileRecord[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeResume = resumes.find((r) => r.isActive && r.status === "published");
  const previousResumes = resumes.filter((r) => r.id !== activeResume?.id);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setStatus({
        ok: false,
        message: "File rejected: only PDF files (.pdf) are permitted.",
      });
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatus({
        ok: false,
        message: `File rejected: file size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum limit of 10 MB.`,
      });
      setSelectedFile(null);
      return;
    }

    setStatus(null);
    setSelectedFile(file);
  }

  async function handleUploadAndActivate() {
    if (!selectedFile) return;

    setBusy(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("fileName", selectedFile.name);

      const res = await fetch("/api/admin/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || data.message || "Failed to upload resume.");
      }

      setStatus({
        ok: true,
        message: data.message || `Resume "${selectedFile.name}" uploaded and set as Active Resume.`,
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setStatus({ ok: false, message: msg });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(resumeId: string) {
    setBusy(true);
    const res = await deleteResumeVersionAction(resumeId);
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    setDeleteId(null);
    router.refresh();
  }

  return (
    <div data-testid="admin-resume-manager" className="space-y-6">
      <AdminPageHeader
        eyebrow="Experience & Settings"
        title="Resume Manager"
        description="Choose a PDF directly from your device. Once uploaded, it is automatically set as the Active Resume and published on your website."
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      {/* Hidden native HTML file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="resume-file-picker"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 1: Choose & Upload from Device */}
        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6">
          <div className="flex items-center gap-2">
            <FileUp className="h-4 w-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">
              {activeResume ? "Replace Active Resume" : "Upload New Resume"}
            </h2>
          </div>

          <p className="text-xs text-secondary-foreground leading-relaxed">
            Select a PDF document from your local computer. Maximum allowed file size is{" "}
            <span className="font-semibold text-foreground">10 MB</span>. Uploading will
            automatically activate and publish the new resume.
          </p>

          <div className="pt-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              data-testid="choose-pdf-button"
              className="w-full sm:w-auto"
            >
              <FileUp className="mr-2 h-4 w-4" aria-hidden="true" />
              Choose PDF from Device
            </Button>
          </div>

          {/* Selected File Card */}
          {selectedFile && (
            <div
              data-testid="selected-file-card"
              className="mt-4 rounded-lg border border-accent/30 bg-surface/50 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-foreground truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatFileSize(selectedFile.size)} • Ready to upload and activate
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={handleUploadAndActivate}
                  data-testid="upload-active-resume-btn"
                  className="w-full"
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Uploading & Activating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Upload & Set as Active Resume
                    </>
                  )}
                </Button>
              </div>

              {busy && (
                <p className="text-[11px] font-mono text-accent animate-pulse text-center">
                  Uploading to storage, persisting metadata, and activating...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Current Active Resume */}
        <div
          data-testid="current-active-resume-section"
          className="space-y-4 rounded-xl border border-border-token bg-background p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Current Active Resume</h2>
            {activeResume && <Badge variant="accent">ACTIVE & PUBLISHED</Badge>}
          </div>

          {activeResume ? (
            <div
              data-testid="current-active-resume-card"
              className="space-y-4 rounded-lg border border-border-token bg-surface/30 p-4 text-xs"
            >
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-6 w-6 text-accent shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-mono font-semibold text-foreground truncate">
                    {activeResume.fileName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-secondary-foreground text-[11px]">
                    <span>Size: {formatFileSize(activeResume.sizeBytes)}</span>
                    <span>•</span>
                    <span>
                      Updated:{" "}
                      {new Date(activeResume.updatedAt).toLocaleDateString("en-US", {
                        dateStyle: "medium",
                      })}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{activeResume.versionLabel}</span>
                  </div>
                  {activeResume.summaryNote && (
                    <p className="text-muted-foreground text-[11px] pt-1">
                      {activeResume.summaryNote}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-token/60">
                <a
                  href={`/api/resume/download/${activeResume.id}?download=true`}
                  download={activeResume.fileName}
                  data-testid="admin-active-resume-download"
                  className="inline-flex items-center gap-1.5 rounded-md bg-button-primary px-3 py-1.5 font-medium text-xs text-white hover:bg-foreground/90 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Download PDF</span>
                </a>
                <a
                  href={`/api/resume/download/${activeResume.id}?preview=true`}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="admin-active-resume-preview"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border-token bg-background px-3 py-1.5 font-medium text-xs text-foreground hover:bg-surface transition-colors"
                >
                  <span>Preview in New Tab</span>
                </a>
              </div>
            </div>
          ) : (
            <div
              data-testid="no-active-resume-state"
              className="rounded-lg border border-dashed border-border-token p-8 text-center text-xs text-muted-foreground"
            >
              <p>No active PDF resume is currently published.</p>
              <p className="mt-1 text-secondary-foreground">
                Choose a PDF from your device above to publish your first resume version.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Previous Versions (History) */}
      {previousResumes.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border-token bg-background p-6">
          <h2 className="text-sm font-semibold text-foreground">
            Previous Resume Versions ({previousResumes.length})
          </h2>

          <div className="divide-y divide-border-token rounded-lg border border-border-token">
            {previousResumes.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-foreground truncate">{r.fileName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatFileSize(r.sizeBytes)} •{" "}
                      {new Date(r.updatedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/api/resume/download/${r.id}?preview=true`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-border-token bg-surface px-2.5 py-1 font-mono text-[11px] text-foreground hover:border-border-strong"
                  >
                    <Download className="h-3 w-3" aria-hidden="true" />
                    <span>Preview</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setDeleteId(r.id)}
                    aria-label={`Delete ${r.fileName}`}
                    className="text-muted-foreground hover:text-red-600 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Resume Version?"
        description="Are you sure you want to permanently delete this previous resume version?"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export function SettingsAndAuditManager({
  siteSettingsEntity,
  revisions,
  publications,
  auditLogs,
}: {
  siteSettingsEntity: VersionedEntityRecord<SiteSettings>;
  revisions: RevisionRecord<unknown>[];
  publications: PublicationRecord[];
  auditLogs: AuditLogEntry[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettings>(siteSettingsEntity.draftData);
  const [activeLanguage, setActiveLanguage] = useState<LanguagePreference>("en");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSaveDraft() {
    setBusy(true);
    const res = await saveSiteSettingsDraftAction(form, "Updated site & SEO settings draft");
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handlePublish() {
    setBusy(true);
    const saved = await saveSiteSettingsDraftAction(form, "Pre-publish site settings");
    if (!saved.ok) {
      setBusy(false);
      setStatus({ ok: false, message: saved.message });
      return;
    }
    const pub = await publishSiteSettingsAction("Published site & SEO settings");
    setBusy(false);
    setStatus({ ok: pub.ok, message: pub.message });
    router.refresh();
  }

  return (
    <div data-testid="admin-settings-manager">
      <AdminPageHeader
        eyebrow="Experience & Settings"
        title="Site Settings, SEO & Immutable Audit Logs"
        description="Configure canonical SEO metadata and inspect immutable revision snapshots, publication records, and administrator audit logs."
        actions={
          <>
            <Button type="button" variant="secondary" disabled={busy} onClick={handleSaveDraft}>
              Save Draft
            </Button>
            <Button type="button" disabled={busy} onClick={handlePublish}>
              Publish Site Settings
            </Button>
          </>
        }
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <AdminLanguageTabs
        activeLanguage={activeLanguage}
        onSelectLanguage={setActiveLanguage}
        completeness={getSiteSettingsCompleteness(form)}
        testIdPrefix="settings"
      />

      <div className="space-y-6">
        <div className="rounded-xl border border-border-token bg-background p-6">
          <h2 className="text-sm font-semibold text-foreground">SEO & Metadata Defaults</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                {activeLanguage === "en" ? "Default Site Title (EN)" : "Default Site Title (ID)"}
              </label>
              {activeLanguage === "en" ? (
                <input
                  type="text"
                  data-testid="settings-title-en-input"
                  value={form.siteTitle}
                  onChange={(e) => setForm({ ...form, siteTitle: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              ) : (
                <input
                  type="text"
                  data-testid="settings-title-id-input"
                  value={form.siteTitleId ?? ""}
                  placeholder={form.siteTitle || "Judul situs dalam Bahasa Indonesia..."}
                  onChange={(e) => setForm({ ...form, siteTitleId: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Canonical Base URL (Shared)
              </label>
              <input
                type="url"
                value={form.canonicalBaseUrl}
                onChange={(e) => setForm({ ...form, canonicalBaseUrl: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en"
                ? "Default Meta Description (EN)"
                : "Default Meta Description (ID)"}
            </label>
            {activeLanguage === "en" ? (
              <textarea
                rows={2}
                data-testid="settings-desc-en-input"
                value={form.siteDescription}
                onChange={(e) => setForm({ ...form, siteDescription: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            ) : (
              <textarea
                rows={2}
                data-testid="settings-desc-id-input"
                value={form.siteDescriptionId ?? ""}
                placeholder={form.siteDescription || "Deskripsi meta situs dalam Bahasa Indonesia..."}
                onChange={(e) => setForm({ ...form, siteDescriptionId: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            )}
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en"
                ? "Footer Text / Attribution (Optional EN)"
                : "Footer Text / Attribution (Optional ID)"}
            </label>
            {activeLanguage === "en" ? (
              <input
                type="text"
                data-testid="settings-footer-en-input"
                value={form.footerText ?? ""}
                placeholder="Handcrafted portfolio built with Next.js, TypeScript & Tailwind CSS"
                onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            ) : (
              <input
                type="text"
                data-testid="settings-footer-id-input"
                value={form.footerTextId ?? ""}
                placeholder={form.footerText || "Portofolio yang dirancang dengan Next.js, TypeScript & Tailwind CSS"}
                onChange={(e) => setForm({ ...form, footerTextId: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            )}
          </div>
        </div>

        {/* Revision History & Audit Trail */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div
            className="rounded-xl border border-border-token bg-background p-6"
            data-testid="revision-history-panel"
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                Immutable Revision History ({revisions.length})
              </h2>
            </div>
            <p className="mt-1 text-xs text-secondary-foreground">
              Every draft save and publication creates a versioned snapshot. Deleting an entity
              preserves its revision history.
            </p>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
              {revisions.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-border-token bg-surface p-3 text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-semibold text-foreground">
                      {r.entityType}:{r.entityId} · v{r.versionNumber}
                    </span>
                    <Badge variant="outline">{r.state}</Badge>
                  </div>
                  <p className="mt-1 text-secondary-foreground">{r.changeSummary}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl border border-border-token bg-background p-6"
            data-testid="audit-log-panel"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                Administrator Audit Logs ({auditLogs.length}) · Publications ({publications.length})
              </h2>
            </div>
            <p className="mt-1 text-xs text-secondary-foreground">
              Append-only security and content publishing audit log.
            </p>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No administrative mutations recorded in this session yet.
                </p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-border-token bg-surface p-3 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-semibold text-accent">{log.action}</span>
                      <span className="text-muted-foreground">
                        {log.entityType}:{log.entityId}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-secondary-foreground">
                      Actor: {log.actorEmail} · {log.createdAt}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
