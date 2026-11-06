"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Plus, Send, Trash2 } from "lucide-react";
import {
  deleteCertificationAction,
  deleteEducationAction,
  deleteExperienceAction,
  deleteNoteAction,
  publishCertificationAction,
  publishEducationAction,
  publishExperienceAction,
  publishNoteAction,
  saveCertificationDraftAction,
  saveEducationDraftAction,
  saveExperienceDraftAction,
  saveNoteDraftAction,
  transitionNoteStateAction,
} from "@/features/admin/actions";
import type { VersionedEntityRecord } from "@/features/publishing/publishing-engine";
import type {
  CertificationItem,
  EducationItem,
  EngineeringNote,
  ExperienceItem,
} from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminConfirmDialog,
  AdminPageHeader,
  AdminStatusBanner,
} from "@/components/admin/admin-feedback";

export function ExperienceManager({
  items,
}: {
  items: VersionedEntityRecord<ExperienceItem>[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(items[0]?.entityId ?? "");
  const active = items.find((i) => i.entityId === selectedId) ?? items[0];

  const [form, setForm] = useState<ExperienceItem>(
    active?.draftData ?? {
      id: "exp-new",
      organization: "Organization",
      role: "Software Engineer",
      employmentType: "Full-time",
      workSystem: "Hybrid",
      location: "Indonesia",
      startMonth: 1,
      startYear: 2025,
      endMonth: null,
      endYear: null,
      isCurrent: true,
      description: "Engineering role description.",
      responsibilities: ["System design and implementation"],
      technicalContributions: ["Backend API development"],
      achievements: [],
      technologies: ["TypeScript"],
      displayOrder: items.length + 1,
      status: "draft",
    },
  );
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSaveDraft() {
    setBusy(true);
    const res = await saveExperienceDraftAction(form);
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handlePublish() {
    setBusy(true);
    const saved = await saveExperienceDraftAction(form);
    if (!saved.ok) {
      setBusy(false);
      setStatus({ ok: false, message: saved.message });
      return;
    }
    const pub = await publishExperienceAction(form.id);
    setBusy(false);
    setStatus({ ok: pub.ok, message: pub.message });
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    const res = await deleteExperienceAction(form.id);
    setBusy(false);
    setDeleteOpen(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  return (
    <div data-testid="admin-experience-manager">
      <AdminPageHeader
        eyebrow="Content Management"
        title="Experience & Organizational Roles"
        description="Manage internships, software engineering roles, and academic organizational leadership."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const id = `exp-${Date.now()}`;
              const created: ExperienceItem = {
                id,
                organization: "New Organization",
                role: "Software Engineering Role",
                employmentType: "Internship",
                workSystem: "Hybrid",
                location: "Indonesia",
                startMonth: 1,
                startYear: 2026,
                endMonth: null,
                endYear: null,
                isCurrent: true,
                description:
                  "Documented responsibilities and technical contributions.",
                responsibilities: ["Backend service implementation"],
                technicalContributions: ["Database query optimization"],
                achievements: [],
                technologies: ["TypeScript", "PostgreSQL"],
                displayOrder: items.length + 1,
                status: "draft",
              };
              setSelectedId(id);
              setForm(created);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            New Experience
          </Button>
        }
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 rounded-xl border border-border-token bg-background p-4">
          {items.map((rec) => (
            <button
              key={rec.entityId}
              type="button"
              onClick={() => {
                setSelectedId(rec.entityId);
                setForm(structuredClone(rec.draftData));
              }}
              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-xs ${
                form.id === rec.entityId
                  ? "border-accent bg-surface font-semibold text-foreground"
                  : "border-border-token bg-background text-secondary-foreground"
              }`}
            >
              <div>
                <p className="font-medium text-foreground">
                  {rec.draftData.role}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {rec.draftData.organization}
                </p>
              </div>
              <Badge
                variant={rec.status === "published" ? "accent" : "outline"}
              >
                {rec.status.toUpperCase()}
              </Badge>
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Role Title
              </label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Organization
              </label>
              <input
                type="text"
                value={form.organization}
                onChange={(e) =>
                  setForm({ ...form, organization: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Summary Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          </div>

          <div className="flex items-center justify-between border-t border-border-token pt-4">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Delete</span>
            </button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={handlePublish}
              >
                Publish Experience
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AdminConfirmDialog
        open={deleteOpen}
        title="Delete Experience Entry?"
        description="Removes this experience record while preserving audit history."
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

export function EducationManager({
  items,
}: {
  items: VersionedEntityRecord<EducationItem>[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(items[0]?.entityId ?? "");
  const active = items.find((i) => i.entityId === selectedId) ?? items[0];

  const [form, setForm] = useState<EducationItem>(
    active?.draftData ?? {
      id: "edu-new",
      institution: "University",
      degree: "Bachelor of Computer Science",
      major: "Informatics Engineering",
      startDate: "2022",
      endDate: "2026",
      isCurrent: false,
      gpa: null,
      thesisTitle: null,
      defenseGrade: null,
      description: "",
      displayOrder: 1,
      status: "draft",
    },
  );
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSaveDraft() {
    setBusy(true);
    const res = await saveEducationDraftAction(form);
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handlePublish() {
    setBusy(true);
    const saved = await saveEducationDraftAction(form);
    if (!saved.ok) {
      setBusy(false);
      setStatus({ ok: false, message: saved.message });
      return;
    }
    const pub = await publishEducationAction(form.id);
    setBusy(false);
    setStatus({ ok: pub.ok, message: pub.message });
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    const res = await deleteEducationAction(form.id);
    setBusy(false);
    setDeleteOpen(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  return (
    <div data-testid="admin-education-manager">
      <AdminPageHeader
        eyebrow="Content Management"
        title="Education & Academic Record"
        description="Manage academic degrees, GPA, and undergraduate thesis defense records."
      />
      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 rounded-xl border border-border-token bg-background p-4">
          {items.map((rec) => (
            <button
              key={rec.entityId}
              type="button"
              onClick={() => {
                setSelectedId(rec.entityId);
                setForm(structuredClone(rec.draftData));
              }}
              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-xs ${
                form.id === rec.entityId
                  ? "border-accent bg-surface font-semibold text-foreground"
                  : "border-border-token bg-background text-secondary-foreground"
              }`}
            >
              <span>{rec.draftData.institution}</span>
              <Badge
                variant={rec.status === "published" ? "accent" : "outline"}
              >
                {rec.status.toUpperCase()}
              </Badge>
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Institution
              </label>
              <input
                type="text"
                value={form.institution}
                onChange={(e) =>
                  setForm({ ...form, institution: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Degree & Major
              </label>
              <input
                type="text"
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                GPA
              </label>
              <input
                type="text"
                value={form.gpa ?? ""}
                onChange={(e) =>
                  setForm({ ...form, gpa: e.target.value || null })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Defense Grade
              </label>
              <input
                type="text"
                value={form.defenseGrade ?? ""}
                onChange={(e) =>
                  setForm({ ...form, defenseGrade: e.target.value || null })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Thesis Title
            </label>
            <input
              type="text"
              value={form.thesisTitle ?? ""}
              onChange={(e) =>
                setForm({ ...form, thesisTitle: e.target.value || null })
              }
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          </div>

          <div className="flex items-center justify-between border-t border-border-token pt-4">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Delete
            </button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={handlePublish}
              >
                Publish Education
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AdminConfirmDialog
        open={deleteOpen}
        title="Delete Education Entry?"
        description="Removes this education record while preserving audit history."
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

export function CertificationsManager({
  items,
}: {
  items: VersionedEntityRecord<CertificationItem>[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(items[0]?.entityId ?? "");
  const active = items.find((i) => i.entityId === selectedId) ?? items[0];

  const [form, setForm] = useState<CertificationItem>(
    active?.draftData ?? {
      id: "cert-new",
      name: "Technical Certification",
      issuingOrganization: "Issuer",
      issueMonth: 1,
      issueYear: 2025,
      expirationMonth: null,
      expirationYear: null,
      credentialId: null,
      credentialUrl: null,
      certificateMediaUrl: null,
      description: "",
      displayOrder: 1,
      status: "draft",
    },
  );
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSaveDraft() {
    setBusy(true);
    const res = await saveCertificationDraftAction(form);
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handlePublish() {
    setBusy(true);
    const saved = await saveCertificationDraftAction(form);
    if (!saved.ok) {
      setBusy(false);
      setStatus({ ok: false, message: saved.message });
      return;
    }
    const pub = await publishCertificationAction(form.id);
    setBusy(false);
    setStatus({ ok: pub.ok, message: pub.message });
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    const res = await deleteCertificationAction(form.id);
    setBusy(false);
    setDeleteOpen(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  return (
    <div data-testid="admin-certifications-manager">
      <AdminPageHeader
        eyebrow="Content Management"
        title="Certifications & Credentials"
        description="Manage verified technical certifications, issuing organizations, and credential links."
      />
      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 rounded-xl border border-border-token bg-background p-4">
          {items.map((rec) => (
            <button
              key={rec.entityId}
              type="button"
              onClick={() => {
                setSelectedId(rec.entityId);
                setForm(structuredClone(rec.draftData));
              }}
              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-xs ${
                form.id === rec.entityId
                  ? "border-accent bg-surface font-semibold text-foreground"
                  : "border-border-token bg-background text-secondary-foreground"
              }`}
            >
              <span>{rec.draftData.name}</span>
              <Badge
                variant={rec.status === "published" ? "accent" : "outline"}
              >
                {rec.status.toUpperCase()}
              </Badge>
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Certificate Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Issuing Organization
              </label>
              <input
                type="text"
                value={form.issuingOrganization}
                onChange={(e) =>
                  setForm({ ...form, issuingOrganization: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Description
            </label>
            <textarea
              rows={2}
              value={form.description ?? ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value || null })
              }
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          </div>

          <div className="flex items-center justify-between border-t border-border-token pt-4">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Delete
            </button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={handlePublish}
              >
                Publish Certification
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AdminConfirmDialog
        open={deleteOpen}
        title="Delete Certification?"
        description="Removes this certification while preserving audit history."
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

export function NotesManager({
  items,
}: {
  items: VersionedEntityRecord<EngineeringNote>[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(items[0]?.entityId ?? "");
  const active = items.find((i) => i.entityId === selectedId) ?? items[0];

  const [form, setForm] = useState<EngineeringNote>(
    active?.draftData ?? {
      id: "note-new",
      title: "New Engineering Note",
      slug: "new-engineering-note",
      summary: "Technical note summary.",
      contentMdx: "## Overview\n\nDetailed architectural note.",
      coverImageUrl: null,
      category: "Architecture",
      tags: ["Systems"],
      publishedAt: new Date().toISOString().slice(0, 10),
      seoTitle: null,
      seoDescription: null,
      status: "draft",
    },
  );
  const [tagsText, setTagsText] = useState(form.tags.join(", "));
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function buildPayload(): EngineeringNote {
    return {
      ...form,
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
  }

  async function handleSaveDraft() {
    setBusy(true);
    const res = await saveNoteDraftAction(buildPayload());
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handlePublish() {
    setBusy(true);
    const payload = buildPayload();
    const saved = await saveNoteDraftAction(payload);
    if (!saved.ok) {
      setBusy(false);
      setStatus({ ok: false, message: saved.message });
      return;
    }
    const pub = await publishNoteAction(payload.id);
    setBusy(false);
    setStatus({ ok: pub.ok, message: pub.message });
    router.refresh();
  }

  async function handleUnpublish() {
    setBusy(true);
    const res = await transitionNoteStateAction({
      noteId: form.id,
      targetState: "draft",
    });
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    const res = await deleteNoteAction(form.id);
    setBusy(false);
    setDeleteOpen(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  return (
    <div data-testid="admin-notes-manager">
      <AdminPageHeader
        eyebrow="Content Management"
        title="Engineering Notes (MDX)"
        description="Author long-form technical articles and system architecture notes with safe MDX rendering."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const id = `note-${Date.now()}`;
              const created: EngineeringNote = {
                id,
                title: "New Architectural Note",
                slug: `note-${Date.now()}`,
                summary:
                  "Concise engineering summary covering system boundaries and tradeoffs.",
                contentMdx:
                  "## Problem Context\n\nDocument the architectural constraints and verified engineering solution.",
                coverImageUrl: null,
                category: "Backend Architecture",
                tags: ["Architecture", "PostgreSQL"],
                publishedAt: new Date().toISOString().slice(0, 10),
                seoTitle: null,
                seoDescription: null,
                status: "draft",
              };
              setSelectedId(id);
              setForm(created);
              setTagsText(created.tags.join(", "));
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            New Engineering Note
          </Button>
        }
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 rounded-xl border border-border-token bg-background p-4">
          {items.map((rec) => (
            <button
              key={rec.entityId}
              type="button"
              onClick={() => {
                setSelectedId(rec.entityId);
                setForm(structuredClone(rec.draftData));
                setTagsText(rec.draftData.tags.join(", "));
              }}
              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-xs ${
                form.id === rec.entityId
                  ? "border-accent bg-surface font-semibold text-foreground"
                  : "border-border-token bg-background text-secondary-foreground"
              }`}
            >
              <div>
                <p className="font-medium text-foreground">
                  {rec.draftData.title}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  /{rec.draftData.slug}
                </p>
              </div>
              <Badge
                variant={rec.status === "published" ? "accent" : "outline"}
              >
                {rec.status.toUpperCase()}
              </Badge>
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-token pb-3">
            <Link
              href={`/notes/${form.slug}?preview=true`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-token bg-surface px-3 py-1.5 text-xs font-medium text-foreground"
            >
              <Eye className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>Preview Draft</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={handlePublish}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Publish Note
              </Button>
              {active?.status === "published" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={handleUnpublish}
                >
                  Unpublish
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Slug (kebab-case)
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Summary
            </label>
            <textarea
              rows={2}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              MDX Content
            </label>
            <textarea
              rows={8}
              value={form.contentMdx}
              onChange={(e) => setForm({ ...form, contentMdx: e.target.value })}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
            />
          </div>

          <div className="border-t border-border-token pt-3">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Delete Note
            </button>
          </div>
        </div>
      </div>

      <AdminConfirmDialog
        open={deleteOpen}
        title="Delete Engineering Note?"
        description="Removes this note while preserving all historical revisions and audit logs."
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
