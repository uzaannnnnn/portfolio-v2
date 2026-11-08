"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  deleteCertificationAction,
  deleteEducationAction,
  deleteExperienceAction,
  publishCertificationAction,
  publishEducationAction,
  publishExperienceAction,
  saveCertificationDraftAction,
  saveEducationDraftAction,
  saveExperienceDraftAction,
  transitionCertificationStateAction,
  transitionEducationStateAction,
  transitionExperienceStateAction,
} from "@/features/admin/actions";
import type { VersionedEntityRecord } from "@/features/publishing/publishing-engine";
import type {
  CertificationItem,
  EducationItem,
  EmploymentType,
  ExperienceItem,
  LanguagePreference,
  WorkSystem,
} from "@/types/portfolio";
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
  getCertificationCompleteness,
  getEducationCompleteness,
  getExperienceCompleteness,
} from "@/lib/i18n/localization";
import { InlineMediaUploader } from "@/components/admin/inline-media-uploader";

const EMPLOYMENT_TYPES: EmploymentType[] = [
  "Full-time",
  "Internship",
  "Part-time",
  "Freelance",
  "Contract",
];

const WORK_SYSTEMS: WorkSystem[] = ["Onsite", "Remote", "Hybrid"];

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
      location: "Bandung, Indonesia",
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
  const [techInput, setTechInput] = useState(form.technologies.join(", "));
  const [activeLanguage, setActiveLanguage] = useState<LanguagePreference>("en");
  const [respTextEn, setRespTextEn] = useState(form.responsibilities.join("\n"));
  const [respTextId, setRespTextId] = useState(
    (form.responsibilitiesId ?? []).join("\n"),
  );
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function buildPayload(): ExperienceItem {
    return {
      ...form,
      responsibilities: respTextEn
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
      responsibilitiesId: respTextId
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
      technologies: techInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
  }

  async function handleSaveDraft() {
    setBusy(true);
    const res = await saveExperienceDraftAction(buildPayload());
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handlePublish() {
    setBusy(true);
    const payload = buildPayload();
    const saved = await saveExperienceDraftAction(payload);
    if (!saved.ok) {
      setBusy(false);
      setStatus({ ok: false, message: saved.message });
      return;
    }
    const pub = await publishExperienceAction(payload.id);
    setBusy(false);
    setStatus({ ok: pub.ok, message: pub.message });
    router.refresh();
  }

  async function handleUnpublish() {
    setBusy(true);
    const res = await transitionExperienceStateAction({
      experienceId: form.id,
      targetState: "draft",
    });
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
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
                location: "Bandung, Indonesia",
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
              setTechInput(created.technologies.join(", "));
              setRespTextEn(created.responsibilities.join("\n"));
              setRespTextId((created.responsibilitiesId ?? []).join("\n"));
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
                const cloned = structuredClone(rec.draftData);
                setForm(cloned);
                setTechInput(cloned.technologies.join(", "));
                setRespTextEn(cloned.responsibilities.join("\n"));
                setRespTextId((cloned.responsibilitiesId ?? []).join("\n"));
              }}
              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-xs ${
                form.id === rec.entityId
                  ? "border-accent bg-surface font-semibold text-foreground"
                  : "border-border-token bg-background text-secondary-foreground"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">
                    {rec.draftData.role}
                  </p>
                  <AdminCompletenessPills
                    completeness={getExperienceCompleteness(rec.draftData)}
                  />
                </div>
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
          <AdminLanguageTabs
            activeLanguage={activeLanguage}
            onSelectLanguage={setActiveLanguage}
            completeness={getExperienceCompleteness(buildPayload())}
            testIdPrefix="experience"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                {activeLanguage === "en"
                  ? "Role Title (English — Required)"
                  : "Role Title (Bahasa Indonesia)"}
              </label>
              {activeLanguage === "en" ? (
                <input
                  type="text"
                  data-testid="experience-role-en-input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              ) : (
                <input
                  type="text"
                  data-testid="experience-role-id-input"
                  value={form.roleId ?? ""}
                  placeholder={form.role || "Judul peran dalam Bahasa Indonesia..."}
                  onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Organization (Shared)
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Employment Type
              </label>
              <select
                value={form.employmentType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    employmentType: e.target.value as EmploymentType,
                  })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              >
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Work System
              </label>
              <select
                value={form.workSystem}
                onChange={(e) =>
                  setForm({
                    ...form,
                    workSystem: e.target.value as WorkSystem,
                  })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              >
                {WORK_SYSTEMS.map((ws) => (
                  <option key={ws} value={ws}>
                    {ws}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Start Month (1–12)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={form.startMonth}
                onChange={(e) =>
                  setForm({ ...form, startMonth: Number(e.target.value) || 1 })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Start Year
              </label>
              <input
                type="number"
                min={1990}
                max={2100}
                value={form.startYear}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startYear: Number(e.target.value) || 2024,
                  })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                End Month (optional)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                disabled={form.isCurrent}
                value={form.endMonth ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endMonth: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                End Year (optional)
              </label>
              <input
                type="number"
                min={1990}
                max={2100}
                disabled={form.isCurrent}
                value={form.endYear ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endYear: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={form.isCurrent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isCurrent: e.target.checked,
                    endMonth: e.target.checked ? null : form.endMonth,
                    endYear: e.target.checked ? null : form.endYear,
                  })
                }
              />
              <span>Current Position</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en"
                ? "Summary Description (English — Required)"
                : "Summary Description (Bahasa Indonesia)"}
            </label>
            {activeLanguage === "en" ? (
              <textarea
                rows={3}
                data-testid="experience-desc-en-input"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            ) : (
              <textarea
                rows={3}
                data-testid="experience-desc-id-input"
                value={form.descriptionId ?? ""}
                placeholder={form.description || "Deskripsi peran dalam Bahasa Indonesia..."}
                onChange={(e) =>
                  setForm({ ...form, descriptionId: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en"
                ? "Key Responsibilities (English — One per line)"
                : "Key Responsibilities (Bahasa Indonesia — One per line)"}
            </label>
            {activeLanguage === "en" ? (
              <textarea
                rows={4}
                data-testid="experience-resp-en-input"
                value={respTextEn}
                onChange={(e) => setRespTextEn(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            ) : (
              <textarea
                rows={4}
                data-testid="experience-resp-id-input"
                value={respTextId}
                placeholder={respTextEn || "Tanggung jawab utama dalam Bahasa Indonesia (satu per baris)..."}
                onChange={(e) => setRespTextId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Technologies (Shared — Comma-separated)
            </label>
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
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
  const [activeLanguage, setActiveLanguage] = useState<LanguagePreference>("en");

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

  async function handleUnpublish() {
    setBusy(true);
    const res = await transitionEducationStateAction({
      educationId: form.id,
      targetState: "draft",
    });
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
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
        description="Manage academic degrees, university, field of study, GPA, and undergraduate thesis defense records displayed inside the Me section."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const id = `edu-${Date.now()}`;
              const created: EducationItem = {
                id,
                institution: "University",
                degree: "Bachelor of Engineering",
                major: "Informatics",
                startDate: "2022",
                endDate: "2026",
                isCurrent: false,
                gpa: null,
                thesisTitle: null,
                defenseGrade: null,
                description:
                  "Academic coursework in software engineering and computer science.",
                displayOrder: items.length + 1,
                status: "draft",
              };
              setSelectedId(id);
              setForm(created);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            New Education
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
              <div className="flex items-center gap-2">
                <span>{rec.draftData.institution}</span>
                <AdminCompletenessPills
                  completeness={getEducationCompleteness(rec.draftData)}
                />
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
          <AdminLanguageTabs
            activeLanguage={activeLanguage}
            onSelectLanguage={setActiveLanguage}
            completeness={getEducationCompleteness(form)}
            testIdPrefix="education"
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Institution / University (Shared)
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
                {activeLanguage === "en"
                  ? "Degree (English — Required)"
                  : "Degree (Bahasa Indonesia)"}
              </label>
              {activeLanguage === "en" ? (
                <input
                  type="text"
                  data-testid="education-degree-en-input"
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              ) : (
                <input
                  type="text"
                  data-testid="education-degree-id-input"
                  value={form.degreeId ?? ""}
                  placeholder={form.degree || "Gelar akademik dalam Bahasa Indonesia..."}
                  onChange={(e) =>
                    setForm({ ...form, degreeId: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                {activeLanguage === "en"
                  ? "Major / Field of Study (English — Required)"
                  : "Major / Field of Study (Bahasa Indonesia)"}
              </label>
              {activeLanguage === "en" ? (
                <input
                  type="text"
                  data-testid="education-major-en-input"
                  value={form.major}
                  onChange={(e) => setForm({ ...form, major: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              ) : (
                <input
                  type="text"
                  data-testid="education-major-id-input"
                  value={form.majorId ?? ""}
                  placeholder={form.major || "Program studi dalam Bahasa Indonesia..."}
                  onChange={(e) => setForm({ ...form, majorId: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Start Date / Year
              </label>
              <input
                type="text"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                End Date / Year
              </label>
              <input
                type="text"
                disabled={form.isCurrent}
                value={form.endDate ?? ""}
                onChange={(e) =>
                  setForm({ ...form, endDate: e.target.value || null })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground disabled:opacity-50"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.isCurrent}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isCurrent: e.target.checked,
                      endDate: e.target.checked ? null : form.endDate,
                    })
                  }
                />
                <span>Currently Enrolled</span>
              </label>
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
              {activeLanguage === "en"
                ? "Thesis Title (English)"
                : "Thesis Title (Bahasa Indonesia)"}
            </label>
            {activeLanguage === "en" ? (
              <input
                type="text"
                data-testid="education-thesis-en-input"
                value={form.thesisTitle ?? ""}
                onChange={(e) =>
                  setForm({ ...form, thesisTitle: e.target.value || null })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            ) : (
              <input
                type="text"
                data-testid="education-thesis-id-input"
                value={form.thesisTitleId ?? ""}
                placeholder={form.thesisTitle || "Judul skripsi dalam Bahasa Indonesia..."}
                onChange={(e) =>
                  setForm({ ...form, thesisTitleId: e.target.value || null })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en"
                ? "Academic Description (English)"
                : "Academic Description (Bahasa Indonesia)"}
            </label>
            {activeLanguage === "en" ? (
              <textarea
                rows={2}
                data-testid="education-desc-en-input"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value || null })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            ) : (
              <textarea
                rows={2}
                data-testid="education-desc-id-input"
                value={form.descriptionId ?? ""}
                placeholder={form.description || "Deskripsi akademik dalam Bahasa Indonesia..."}
                onChange={(e) =>
                  setForm({ ...form, descriptionId: e.target.value || null })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            )}
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
  const [activeLanguage, setActiveLanguage] = useState<LanguagePreference>("en");

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

  async function handleUnpublish() {
    setBusy(true);
    const res = await transitionCertificationStateAction({
      certificationId: form.id,
      targetState: "draft",
    });
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
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
        description="Manage verified technical certifications, issuing organizations, issue/expiration dates, and credential links."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const id = `cert-${Date.now()}`;
              const created: CertificationItem = {
                id,
                name: "New Technical Certification",
                issuingOrganization: "Issuing Organization",
                issueMonth: 1,
                issueYear: 2026,
                expirationMonth: null,
                expirationYear: null,
                credentialId: null,
                credentialUrl: null,
                certificateMediaUrl: null,
                description: null,
                displayOrder: items.length + 1,
                status: "draft",
              };
              setSelectedId(id);
              setForm(created);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            New Certification
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
              <div className="flex items-center gap-2">
                <span>{rec.draftData.name}</span>
                <AdminCompletenessPills
                  completeness={getCertificationCompleteness(rec.draftData)}
                />
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
          <AdminLanguageTabs
            activeLanguage={activeLanguage}
            onSelectLanguage={setActiveLanguage}
            completeness={getCertificationCompleteness(form)}
            testIdPrefix="certification"
          />

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

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Issue Month (1–12)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={form.issueMonth}
                onChange={(e) =>
                  setForm({ ...form, issueMonth: Number(e.target.value) || 1 })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Issue Year
              </label>
              <input
                type="number"
                min={1990}
                max={2100}
                value={form.issueYear}
                onChange={(e) =>
                  setForm({
                    ...form,
                    issueYear: Number(e.target.value) || 2025,
                  })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Exp. Month (optional)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={form.expirationMonth ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    expirationMonth: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Exp. Year (optional)
              </label>
              <input
                type="number"
                min={1990}
                max={2100}
                value={form.expirationYear ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    expirationYear: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Credential ID (optional)
              </label>
              <input
                type="text"
                value={form.credentialId ?? ""}
                onChange={(e) =>
                  setForm({ ...form, credentialId: e.target.value || null })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Credential Verification URL (External link)
              </label>
              <input
                type="url"
                value={form.credentialUrl ?? ""}
                placeholder="https://credly.com/..."
                onChange={(e) =>
                  setForm({ ...form, credentialUrl: e.target.value || null })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <InlineMediaUploader
                bucket="certificates"
                value={form.certificateMediaUrl}
                onChange={(url) =>
                  setForm({ ...form, certificateMediaUrl: url })
                }
                label="Certificate Document / Image (Device Upload)"
                helperText="Upload PDF or image up to 10 MB directly from device"
                testIdPrefix="cert-media"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en"
                ? "Description (English)"
                : "Description (Bahasa Indonesia)"}
            </label>
            {activeLanguage === "en" ? (
              <textarea
                rows={2}
                data-testid="cert-desc-en-input"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value || null })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            ) : (
              <textarea
                rows={2}
                data-testid="cert-desc-id-input"
                value={form.descriptionId ?? ""}
                placeholder={form.description || "Deskripsi kredensial/sertifikasi dalam Bahasa Indonesia..."}
                onChange={(e) =>
                  setForm({ ...form, descriptionId: e.target.value || null })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            )}
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

