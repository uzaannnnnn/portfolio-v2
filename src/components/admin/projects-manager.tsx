"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Plus,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  deleteProjectAction,
  publishProjectAction,
  saveProjectDraftAction,
  transitionProjectStateAction,
} from "@/features/admin/actions";
import type {
  RevisionRecord,
  VersionedEntityRecord,
} from "@/features/publishing/publishing-engine";
import type {
  CaseStudySection,
  CaseStudySectionType,
  ProjectDetail,
} from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminConfirmDialog,
  AdminPageHeader,
  AdminStatusBanner,
} from "@/components/admin/admin-feedback";

const ALL_14_SECTION_TYPES: Array<{
  type: CaseStudySectionType;
  defaultTitle: string;
}> = [
  { type: "overview", defaultTitle: "Project Overview" },
  { type: "problem", defaultTitle: "Problem Statement" },
  { type: "objectives", defaultTitle: "Objectives & Success Criteria" },
  { type: "solution", defaultTitle: "Solution Summary" },
  { type: "architecture", defaultTitle: "System Architecture" },
  { type: "implementation", defaultTitle: "Key Technical Implementation" },
  { type: "database", defaultTitle: "Database / Data Flow Design" },
  { type: "api", defaultTitle: "API / Backend Workflow" },
  { type: "challenges", defaultTitle: "Engineering Challenges" },
  { type: "tradeoffs", defaultTitle: "Key Technical Decisions & Tradeoffs" },
  { type: "testing", defaultTitle: "Testing & Validation" },
  { type: "deployment", defaultTitle: "Deployment / Runtime Environment" },
  { type: "results", defaultTitle: "Results / Current Project State" },
  { type: "lessons", defaultTitle: "Lessons Learned & Future Improvements" },
];

function ensureAll14Sections(
  projectId: string,
  existing: CaseStudySection[],
): CaseStudySection[] {
  const byType = new Map<CaseStudySectionType, CaseStudySection>();
  for (const sec of existing) {
    byType.set(sec.sectionType, sec);
  }
  return ALL_14_SECTION_TYPES.map((meta, idx) => {
    const found = byType.get(meta.type);
    if (found) {
      return { ...found, displayOrder: idx + 1 };
    }
    return {
      id: `${projectId}-sec-${meta.type}`,
      sectionType: meta.type,
      title: meta.defaultTitle,
      content: "",
      displayOrder: idx + 1,
      isEnabled: false,
    };
  });
}

export function ProjectsManager({
  projects,
  revisions,
}: {
  projects: VersionedEntityRecord<ProjectDetail>[];
  revisions: RevisionRecord<unknown>[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(
    projects[0]?.entityId ?? "",
  );
  const currentEntity =
    projects.find((p) => p.entityId === selectedId) ?? projects[0];

  const [form, setForm] = useState<ProjectDetail>(() => {
    const base = currentEntity?.draftData ?? {
      id: "proj-new",
      slug: "new-engineering-project",
      name: "New Engineering Project",
      description: "Structured engineering case study.",
      category: "Full-Stack",
      technologies: ["TypeScript", "Next.js"],
      coverUrl: null,
      githubUrl: null,
      liveDemoUrl: null,
      projectCompletionState: "Draft Case Study",
      status: "draft" as const,
      isFeatured: false,
      displayOrder: projects.length + 1,
      updatedAt: new Date().toISOString().slice(0, 10),
      screenshots: [],
      caseStudySections: [],
    };
    return {
      ...base,
      caseStudySections: ensureAll14Sections(base.id, base.caseStudySections),
    };
  });

  const [techInput, setTechInput] = useState(form.technologies.join(", "));
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function handleSelectProject(entity: VersionedEntityRecord<ProjectDetail>) {
    setSelectedId(entity.entityId);
    const cloned = structuredClone(entity.draftData);
    cloned.caseStudySections = ensureAll14Sections(
      cloned.id,
      cloned.caseStudySections,
    );
    setForm(cloned);
    setTechInput(cloned.technologies.join(", "));
  }

  function handleCreateNewProject() {
    const id = `proj-${Date.now()}`;
    const blank: ProjectDetail = {
      id,
      slug: `project-${Date.now()}`,
      name: "New Engineering System",
      description:
        "Production-oriented engineering system with documented architecture.",
      category: "Backend & Systems",
      technologies: ["TypeScript", "PostgreSQL"],
      coverUrl: null,
      githubUrl: null,
      liveDemoUrl: null,
      projectCompletionState: "In Development",
      status: "draft",
      isFeatured: true,
      displayOrder: projects.length + 1,
      updatedAt: new Date().toISOString().slice(0, 10),
      screenshots: [],
      caseStudySections: ensureAll14Sections(id, [
        {
          id: `${id}-sec-overview`,
          sectionType: "overview",
          title: "Project Overview",
          content:
            "Detailed technical overview of the engineering problem and system boundaries.",
          displayOrder: 1,
          isEnabled: true,
        },
      ]),
    };
    setSelectedId(id);
    setForm(blank);
    setTechInput(blank.technologies.join(", "));
  }

  function buildPayload(): ProjectDetail {
    return {
      ...form,
      technologies: techInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= form.caseStudySections.length) return;
    const next = [...form.caseStudySections];
    const currentItem = next[index];
    const targetItem = next[target];
    if (!currentItem || !targetItem) return;
    next[index] = targetItem;
    next[target] = currentItem;
    setForm({
      ...form,
      caseStudySections: next.map((sec, idx) => ({
        ...sec,
        displayOrder: idx + 1,
      })),
    });
  }

  async function handleSaveDraft() {
    setBusy(true);
    const payload = buildPayload();
    const res = await saveProjectDraftAction(
      payload,
      `Saved draft for ${payload.name}`,
    );
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handlePublish() {
    setBusy(true);
    const payload = buildPayload();
    const saved = await saveProjectDraftAction(
      payload,
      `Pre-publish draft save for ${payload.name}`,
    );
    if (!saved.ok) {
      setBusy(false);
      setStatus({ ok: false, message: saved.message });
      return;
    }
    const pub = await publishProjectAction(
      payload.id,
      `Published ${payload.name}`,
    );
    setBusy(false);
    setStatus({ ok: pub.ok, message: pub.message });
    router.refresh();
  }

  async function handleTransitionState(targetState: "draft" | "archived") {
    setBusy(true);
    const res = await transitionProjectStateAction({
      projectId: form.id,
      targetState,
    });
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handleConfirmDelete() {
    setBusy(true);
    const res = await deleteProjectAction(form.id);
    setBusy(false);
    setConfirmDeleteOpen(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  const projectRevisions = revisions.filter(
    (r) => r.entityType === "project" && r.entityId === form.id,
  );

  return (
    <div data-testid="admin-projects-manager">
      <AdminPageHeader
        eyebrow="Content Management"
        title="Projects & 14-Section Case Studies"
        description="Manage project metadata, technologies, and all 14 engineering case study sections. Draft edits remain isolated until published."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={handleCreateNewProject}
            data-testid="create-new-project-btn"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            New Project Draft
          </Button>
        }
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Project Selector + Revisions */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-xl border border-border-token bg-background p-4">
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Projects ({projects.length})
            </p>
            <div className="mt-3 space-y-2">
              {projects.map((record) => (
                <button
                  key={record.entityId}
                  type="button"
                  data-testid={`select-project-${record.draftData.slug}`}
                  onClick={() => handleSelectProject(record)}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-xs transition-colors ${
                    form.id === record.entityId
                      ? "border-accent bg-surface font-semibold text-foreground"
                      : "border-border-token bg-background text-secondary-foreground hover:bg-surface"
                  }`}
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {record.draftData.name}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      /{record.draftData.slug}
                    </p>
                  </div>
                  <Badge
                    variant={
                      record.status === "published" ? "accent" : "outline"
                    }
                  >
                    {record.status.toUpperCase()}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border-token bg-background p-4">
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Revision History ({projectRevisions.length})
            </p>
            <div className="mt-3 space-y-2">
              {projectRevisions.slice(0, 6).map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-md border border-border-token bg-surface p-2.5 text-[11px]"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-semibold text-foreground">
                      v{rev.versionNumber}
                    </span>
                    <Badge variant="outline">{rev.state}</Badge>
                  </div>
                  <p className="mt-1 text-secondary-foreground">
                    {rev.changeSummary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Project Metadata + 14 Case Study Sections */}
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-xl border border-border-token bg-background p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-token pb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {form.name}
                </h2>
                <p className="font-mono text-xs text-secondary-foreground">
                  Public State:{" "}
                  <strong>
                    {currentEntity?.status.toUpperCase() ?? "DRAFT"}
                  </strong>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/projects/${form.slug}?preview=true`}
                  data-testid="project-preview-draft-link"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border-token bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:border-border-strong"
                >
                  <Eye className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span>Preview Draft</span>
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={handleSaveDraft}
                  data-testid="project-save-draft-btn"
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={handlePublish}
                  data-testid="project-publish-btn"
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Publish Project
                </Button>
                {currentEntity?.status === "published" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => handleTransitionState("draft")}
                    data-testid="project-unpublish-btn"
                  >
                    <Undo2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    Unpublish to Draft
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="proj-name"
                  className="block text-xs font-medium text-foreground"
                >
                  Project Name
                </label>
                <input
                  id="proj-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              </div>
              <div>
                <label
                  htmlFor="proj-slug"
                  className="block text-xs font-medium text-foreground"
                >
                  Slug (kebab-case)
                </label>
                <input
                  id="proj-slug"
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
                />
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="proj-desc"
                className="block text-xs font-medium text-foreground"
              >
                Summary Description
              </label>
              <textarea
                id="proj-desc"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-foreground">
                  Category
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground">
                  Project Completion State
                </label>
                <input
                  type="text"
                  value={form.projectCompletionState}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      projectCompletionState: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-foreground">
                Technologies (Comma-separated)
              </label>
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border-token pt-4">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) =>
                    setForm({ ...form, isFeatured: e.target.checked })
                  }
                />
                <span>Feature on Homepage (when Published)</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleTransitionState("archived")}
                  className="text-xs font-medium text-secondary-foreground hover:text-foreground"
                >
                  Archive Project
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  data-testid="project-delete-trigger"
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>

          {/* 14-Section Case Study Editor */}
          <div className="rounded-xl border border-border-token bg-background p-6">
            <h3 className="text-sm font-semibold text-foreground">
              14-Section Engineering Case Study Builder
            </h3>
            <p className="mt-1 text-xs text-secondary-foreground">
              Enable, reorder, and author each of the 14 structured case study
              sections. Disabled or empty sections are automatically omitted on
              the public page.
            </p>

            <div className="mt-4 space-y-4">
              {form.caseStudySections.map((sec, idx) => (
                <div
                  key={sec.id}
                  data-testid={`case-study-editor-sec-${sec.sectionType}`}
                  className="rounded-lg border border-border-token bg-surface p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={sec.isEnabled}
                        aria-label={`Enable ${sec.title}`}
                        onChange={(e) => {
                          const updated = [...form.caseStudySections];
                          updated[idx] = {
                            ...sec,
                            isEnabled: e.target.checked,
                          };
                          setForm({ ...form, caseStudySections: updated });
                        }}
                      />
                      <span className="font-mono text-[11px] uppercase text-accent">
                        {idx + 1}. {sec.sectionType}
                      </span>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => {
                          const updated = [...form.caseStudySections];
                          updated[idx] = { ...sec, title: e.target.value };
                          setForm({ ...form, caseStudySections: updated });
                        }}
                        className="rounded border border-border-token bg-background px-2.5 py-1 text-xs font-semibold text-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, -1)}
                        disabled={idx === 0}
                        aria-label={`Move ${sec.title} up`}
                        className="rounded border border-border-token bg-background p-1 text-secondary-foreground disabled:opacity-40"
                      >
                        <ArrowUp className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, 1)}
                        disabled={idx === form.caseStudySections.length - 1}
                        aria-label={`Move ${sec.title} down`}
                        className="rounded border border-border-token bg-background p-1 text-secondary-foreground disabled:opacity-40"
                      >
                        <ArrowDown className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {sec.isEnabled && (
                    <textarea
                      rows={3}
                      value={sec.content}
                      onChange={(e) => {
                        const updated = [...form.caseStudySections];
                        updated[idx] = { ...sec, content: e.target.value };
                        setForm({ ...form, caseStudySections: updated });
                      }}
                      placeholder={`Write verified engineering details for ${sec.title}...`}
                      className="mt-3 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AdminConfirmDialog
        open={confirmDeleteOpen}
        title={`Delete Project "${form.name}"?`}
        description="Deleting this project removes it from active CMS entities. All historical revision snapshots and immutable audit log entries will remain preserved."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
