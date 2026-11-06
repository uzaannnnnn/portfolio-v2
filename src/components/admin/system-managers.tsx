"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  FileText,
  History,
  Image as ImageIcon,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import {
  deleteBootGreetingAction,
  deleteMediaAssetAction,
  deleteResumeVersionAction,
  publishActiveResumeAction,
  publishSiteSettingsAction,
  saveBootGreetingAction,
  saveSiteSettingsDraftAction,
  uploadMediaAssetAction,
  uploadResumeVersionAction,
} from "@/features/admin/actions";
import type {
  AuditLogEntry,
  PublicationRecord,
  RevisionRecord,
  VersionedEntityRecord,
} from "@/features/publishing/publishing-engine";
import type {
  MediaAssetRecord,
  ResumeFileRecord,
} from "@/lib/database/cms-store";
import type { StorageBucketName } from "@/types/database";
import type { BootGreeting, SiteSettings } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminConfirmDialog,
  AdminPageHeader,
  AdminStatusBanner,
} from "@/components/admin/admin-feedback";

export function BootExperienceManager({
  greetings,
  siteSettingsEntity,
}: {
  greetings: BootGreeting[];
  siteSettingsEntity: VersionedEntityRecord<SiteSettings>;
}) {
  const router = useRouter();
  const [welcomeForm, setWelcomeForm] = useState(
    siteSettingsEntity.draftData.bootWelcome,
  );
  const [newGreeting, setNewGreeting] = useState<BootGreeting>({
    id: `greet-${Date.now()}`,
    language: "",
    greeting: "",
    meaning: "Welcome",
    isEnabled: true,
    displayOrder: greetings.length + 1,
    status: "published",
  });
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
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
          <h2 className="text-sm font-semibold text-foreground">
            Welcome Screen Configuration
          </h2>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={welcomeForm.enabled}
              onChange={(e) =>
                setWelcomeForm({ ...welcomeForm, enabled: e.target.checked })
              }
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
              Welcome Message
            </label>
            <input
              type="text"
              value={welcomeForm.welcomeMessage}
              onChange={(e) =>
                setWelcomeForm({
                  ...welcomeForm,
                  welcomeMessage: e.target.value,
                })
              }
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
            />
          </div>

          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={handleSaveWelcomeConfig}
          >
            Save & Publish Boot Config
          </Button>
        </div>

        {/* Regional Greetings Table & Add Form */}
        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">
            Regional Greetings ({greetings.length})
          </h2>

          <div className="grid gap-2 sm:grid-cols-4">
            <input
              type="text"
              placeholder="Language (e.g., Aceh)"
              value={newGreeting.language}
              onChange={(e) =>
                setNewGreeting({ ...newGreeting, language: e.target.value })
              }
              className="rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
            />
            <input
              type="text"
              placeholder="Greeting phrase"
              value={newGreeting.greeting}
              onChange={(e) =>
                setNewGreeting({ ...newGreeting, greeting: e.target.value })
              }
              className="rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
            />
            <input
              type="text"
              placeholder="Meaning"
              value={newGreeting.meaning}
              onChange={(e) =>
                setNewGreeting({ ...newGreeting, meaning: e.target.value })
              }
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
                  <span className="font-mono text-[11px] text-accent">
                    #{g.displayOrder} · {g.language}
                  </span>
                  <p className="font-semibold text-foreground">{g.greeting}</p>
                  <p className="text-[11px] text-secondary-foreground">
                    &ldquo;{g.meaning}&rdquo;
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

const BUCKETS: StorageBucketName[] = [
  "projects",
  "profile",
  "certificates",
  "articles",
  "og-images",
];

export function MediaLibraryManager({
  assets,
}: {
  assets: MediaAssetRecord[];
}) {
  const router = useRouter();
  const [bucket, setBucket] = useState<StorageBucketName>("projects");
  const [fileName, setFileName] = useState("geoentity-architecture.webp");
  const [mimeType, setMimeType] = useState("image/webp");
  const [sizeBytes, setSizeBytes] = useState(245000);
  const [altText, setAltText] = useState(
    "GeoEntity PostGIS spatial indexing diagram",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleUpload() {
    setBusy(true);
    const res = await uploadMediaAssetAction({
      bucket,
      fileName,
      mimeType,
      sizeBytes,
      altText,
    });
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!deleteId) return;
    setBusy(true);
    const res = await deleteMediaAssetAction(deleteId);
    setBusy(false);
    setDeleteId(null);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  const filtered = assets.filter(
    (a) =>
      a.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.altText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.bucket.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div data-testid="admin-media-manager">
      <AdminPageHeader
        eyebrow="Experience & Settings"
        title="Media Library & Storage Buckets"
        description="Upload validated images and PDFs to structured buckets. Active references in projects and certifications are protected from accidental deletion."
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6">
          <h2 className="text-sm font-semibold text-foreground">
            Upload Media Asset
          </h2>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Target Bucket
            </label>
            <select
              value={bucket}
              onChange={(e) => setBucket(e.target.value as StorageBucketName)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            >
              {BUCKETS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                MIME Type
              </label>
              <input
                type="text"
                value={mimeType}
                onChange={(e) => setMimeType(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Size (Bytes)
              </label>
              <input
                type="number"
                value={sizeBytes}
                onChange={(e) => setSizeBytes(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Accessibility Alt Text
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          </div>

          <Button
            type="button"
            disabled={busy}
            onClick={handleUpload}
            data-testid="upload-media-btn"
            className="w-full"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Validate & Upload Asset
          </Button>
        </div>

        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              Stored Assets ({filtered.length})
            </h2>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search filename or bucket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-md border border-border-token bg-surface pl-8 pr-3 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-token p-8 text-center text-xs text-muted-foreground">
              No media assets uploaded in this session yet.
            </div>
          ) : (
            <div className="divide-y divide-border-token rounded-lg border border-border-token">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <ImageIcon
                      className="h-5 w-5 text-accent"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-mono font-semibold text-foreground">
                        {item.storagePath}
                      </p>
                      <p className="text-[11px] text-secondary-foreground">
                        {item.mimeType} · {(item.sizeBytes / 1024).toFixed(1)}{" "}
                        KB · Alt: &ldquo;{item.altText || "None"}&rdquo;
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.bucket}</Badge>
                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      aria-label={`Delete ${item.fileName}`}
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Media Asset?"
        description="If this asset is currently referenced by any project or certification, deletion will be blocked."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export function ResumeManager({
  resumes,
}: {
  resumes: ResumeFileRecord[];
}) {
  const router = useRouter();
  const [versionLabel, setVersionLabel] = useState("v2026.1");
  const [fileName, setFileName] = useState(
    "Muhamad-Fauzan-Software-Engineer-Resume.pdf",
  );
  const [summaryNote, setSummaryNote] = useState(
    "Updated backend architecture and thesis defense highlights",
  );
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  async function handleUploadResume() {
    setBusy(true);
    const res = await uploadResumeVersionAction({
      versionLabel,
      fileName,
      mimeType: "application/pdf",
      sizeBytes: 185000,
      summaryNote,
    });
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handlePublishActive(resumeId: string) {
    setBusy(true);
    const res = await publishActiveResumeAction(resumeId);
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handleDelete(resumeId: string) {
    setBusy(true);
    const res = await deleteResumeVersionAction(resumeId);
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  return (
    <div data-testid="admin-resume-manager">
      <AdminPageHeader
        eyebrow="Experience & Settings"
        title="Resume / CV Version Manager"
        description="Upload PDF resume versions as strictly private drafts. Only the single version marked Active & Published is downloadable by public visitors."
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6">
          <h2 className="text-sm font-semibold text-foreground">
            Upload New Resume PDF (Private Draft)
          </h2>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Version Label
            </label>
            <input
              type="text"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              PDF File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Revision Summary Note
            </label>
            <textarea
              rows={2}
              value={summaryNote}
              onChange={(e) => setSummaryNote(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          </div>

          <Button
            type="button"
            disabled={busy}
            onClick={handleUploadResume}
            data-testid="upload-resume-btn"
            className="w-full"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Upload Private Draft PDF
          </Button>
        </div>

        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">
            Resume Versions ({resumes.length})
          </h2>

          {resumes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-token p-8 text-center text-xs text-muted-foreground">
              No resume PDF uploaded yet. Public website displays an honest
              &ldquo;Resume available upon request&rdquo; fallback.
            </div>
          ) : (
            <div className="divide-y divide-border-token rounded-lg border border-border-token">
              {resumes.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <FileText
                      className="mt-0.5 h-5 w-5 text-accent"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-foreground">
                          {r.versionLabel}
                        </span>
                        <span className="text-secondary-foreground">
                          ({r.fileName})
                        </span>
                        <Badge
                          variant={
                            r.status === "published" && r.isActive
                              ? "accent"
                              : "outline"
                          }
                        >
                          {r.isActive ? "ACTIVE PUBLIC" : r.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="mt-1 text-secondary-foreground">
                        {r.summaryNote}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/resume/download/${r.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-border-token bg-surface px-2.5 py-1 font-mono text-[11px] text-foreground hover:border-border-strong"
                    >
                      <Download className="h-3 w-3" aria-hidden="true" />
                      <span>Preview PDF</span>
                    </a>
                    {!r.isActive && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => handlePublishActive(r.id)}
                        data-testid={`publish-resume-${r.id}`}
                      >
                        <CheckCircle2
                          className="mr-1 h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        Set Active & Publish
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      aria-label={`Delete ${r.versionLabel}`}
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  async function handleSaveDraft() {
    setBusy(true);
    const res = await saveSiteSettingsDraftAction(
      form,
      "Updated site & SEO settings draft",
    );
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handlePublish() {
    setBusy(true);
    const saved = await saveSiteSettingsDraftAction(
      form,
      "Pre-publish site settings",
    );
    if (!saved.ok) {
      setBusy(false);
      setStatus({ ok: false, message: saved.message });
      return;
    }
    const pub = await publishSiteSettingsAction(
      "Published site & SEO settings",
    );
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
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={handleSaveDraft}
            >
              Save Draft
            </Button>
            <Button type="button" disabled={busy} onClick={handlePublish}>
              Publish Site Settings
            </Button>
          </>
        }
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="space-y-6">
        <div className="rounded-xl border border-border-token bg-background p-6">
          <h2 className="text-sm font-semibold text-foreground">
            SEO & Metadata Defaults
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Default Site Title
              </label>
              <input
                type="text"
                value={form.siteTitle}
                onChange={(e) =>
                  setForm({ ...form, siteTitle: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Canonical Base URL
              </label>
              <input
                type="url"
                value={form.canonicalBaseUrl}
                onChange={(e) =>
                  setForm({ ...form, canonicalBaseUrl: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-foreground">
              Default Meta Description
            </label>
            <textarea
              rows={2}
              value={form.siteDescription}
              onChange={(e) =>
                setForm({ ...form, siteDescription: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
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
              Every draft save and publication creates a versioned snapshot.
              Deleting an entity preserves its revision history.
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
                  <p className="mt-1 text-secondary-foreground">
                    {r.changeSummary}
                  </p>
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
                Administrator Audit Logs ({auditLogs.length}) · Publications (
                {publications.length})
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
                      <span className="font-semibold text-accent">
                        {log.action}
                      </span>
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
