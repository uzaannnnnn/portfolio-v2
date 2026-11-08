"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
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
import {
  TECHNOLOGY_CATEGORIES,
  type CaseStudySection,
  type CaseStudySectionType,
  type CategorizedTechnologyItem,
  type LanguagePreference,
  type ProjectDetail,
  type TechnologyCategory,
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
import { getProjectCompleteness } from "@/lib/i18n/localization";
import {
  InlineMediaUploader,
  InlineGalleryUploader,
} from "@/components/admin/inline-media-uploader";

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
      version: "v1.0.0",
      description: "Structured engineering case study.",
      category: "Full-Stack",
      technologies: ["TypeScript", "Next.js"],
      categorizedTechnologies: [
        { category: "FE" as const, name: "Next.js" },
        { category: "ARCHITECTURE" as const, name: "TypeScript" },
      ],
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
    const initialCategorized: CategorizedTechnologyItem[] =
      base.categorizedTechnologies && base.categorizedTechnologies.length > 0
        ? base.categorizedTechnologies
        : (base.technologies || []).map((t) => ({ category: "ARCHITECTURE" as const, name: t }));
    return {
      ...base,
      version: base.version ?? "v1.0.0",
      categorizedTechnologies: initialCategorized,
      caseStudySections: ensureAll14Sections(base.id, base.caseStudySections),
    };
  });

  const [selectedTechCategory, setSelectedTechCategory] =
    useState<TechnologyCategory>("FE");
  const [newTechName, setNewTechName] = useState("");
  const [activeLanguage, setActiveLanguage] = useState<LanguagePreference>("en");
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
    if (!cloned.version) {
      cloned.version = "v1.0.0";
    }
    if (!cloned.categorizedTechnologies || cloned.categorizedTechnologies.length === 0) {
      cloned.categorizedTechnologies = (cloned.technologies || []).map((t) => ({
        category: "ARCHITECTURE" as const,
        name: t,
      }));
    }
    setForm(cloned);
    setNewTechName("");
  }

  function handleCreateNewProject() {
    const id = `proj-${Date.now()}`;
    const blank: ProjectDetail = {
      id,
      slug: `project-${Date.now()}`,
      name: "New Engineering System",
      version: "v1.0.0",
      description:
        "Production-oriented engineering system with documented architecture.",
      category: "Backend & Systems",
      technologies: ["TypeScript", "PostgreSQL"],
      categorizedTechnologies: [
        { category: "ARCHITECTURE", name: "TypeScript" },
        { category: "DB", name: "PostgreSQL" },
      ],
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
    setNewTechName("");
  }

  function handleAddTechnology() {
    const trimmed = newTechName.trim();
    if (!trimmed) return;
    const currentList = form.categorizedTechnologies ?? [];
    if (
      currentList.some(
        (t) =>
          t.category === selectedTechCategory &&
          t.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      setNewTechName("");
      return;
    }
    const nextList = [
      ...currentList,
      { category: selectedTechCategory, name: trimmed },
    ];
    setForm({
      ...form,
      categorizedTechnologies: nextList,
      technologies: nextList.map((t) => t.name),
    });
    setNewTechName("");
  }

  function handleRemoveTechnology(indexToRemove: number) {
    const currentList = form.categorizedTechnologies ?? [];
    const nextList = currentList.filter((_, idx) => idx !== indexToRemove);
    setForm({
      ...form,
      categorizedTechnologies: nextList,
      technologies: nextList.map((t) => t.name),
    });
  }

  function buildPayload(): ProjectDetail {
    const categorized = form.categorizedTechnologies ?? [];
    return {
      ...form,
      version: form.version?.trim() || "v1.0.0",
      categorizedTechnologies: categorized,
      technologies:
        categorized.length > 0
          ? categorized.map((t) => t.name)
          : form.technologies,
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {record.draftData.name}
                      </p>
                      <AdminCompletenessPills
                        completeness={getProjectCompleteness(record.draftData)}
                      />
                    </div>
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
          <AdminLanguageTabs
            activeLanguage={activeLanguage}
            onSelectLanguage={setActiveLanguage}
            completeness={getProjectCompleteness(buildPayload())}
            testIdPrefix="project"
          />

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

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="proj-name"
                  className="block text-xs font-medium text-foreground"
                >
                  Project Name (Required)
                </label>
                <input
                  id="proj-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="project-version"
                  className="block text-xs font-medium text-foreground"
                >
                  Version (Required)
                </label>
                <input
                  id="project-version"
                  data-testid="project-version-input"
                  type="text"
                  placeholder="e.g. v1.0, v1.2.3, 1.0.0"
                  value={form.version ?? ""}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
                  required
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
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="proj-desc"
                className="block text-xs font-medium text-foreground"
              >
                {activeLanguage === "en"
                  ? "Summary Description (English — Required)"
                  : "Summary Description (Bahasa Indonesia)"}
              </label>
              {activeLanguage === "en" ? (
                <textarea
                  id="proj-desc"
                  rows={2}
                  data-testid="project-desc-en-input"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              ) : (
                <textarea
                  id="proj-desc"
                  rows={2}
                  data-testid="project-desc-id-input"
                  value={form.descriptionId ?? ""}
                  placeholder={form.description || "Deskripsi ringkas proyek dalam Bahasa Indonesia..."}
                  onChange={(e) =>
                    setForm({ ...form, descriptionId: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              )}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-foreground">
                {activeLanguage === "en"
                  ? "Project Completion State (English — Required)"
                  : "Project Completion State (Bahasa Indonesia)"}
              </label>
              {activeLanguage === "en" ? (
                <input
                  type="text"
                  data-testid="project-completion-en-input"
                  value={form.projectCompletionState}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      projectCompletionState: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              ) : (
                <input
                  type="text"
                  data-testid="project-completion-id-input"
                  value={form.projectCompletionStateId ?? ""}
                  placeholder={form.projectCompletionState || "Status penyelesaian proyek dalam Bahasa Indonesia"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      projectCompletionStateId: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <InlineMediaUploader
                  bucket="projects"
                  value={form.coverUrl}
                  onChange={(url) => setForm({ ...form, coverUrl: url })}
                  label="Project Cover Image"
                  helperText="Upload PNG, JPG, WebP or AVIF up to 10 MB directly from device"
                  testIdPrefix="project-cover"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="project-repository-url"
                    className="block text-xs font-medium text-foreground"
                  >
                    Repository URL
                  </label>
                  <input
                    id="project-repository-url"
                    data-testid="project-repository-url-input"
                    type="url"
                    value={form.githubUrl ?? ""}
                    placeholder="https://github.com/... or https://gitlab.com/..."
                    onChange={(e) =>
                      setForm({
                        ...form,
                        githubUrl: e.target.value.trim() || null,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-2 focus-visible:outline-accent"
                  />
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Optional. Source repository URL (GitHub, GitLab, etc.).
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="project-live-demo-url"
                    className="block text-xs font-medium text-foreground"
                  >
                    Live Demo URL
                  </label>
                  <input
                    id="project-live-demo-url"
                    data-testid="project-live-demo-url-input"
                    type="url"
                    value={form.liveDemoUrl ?? ""}
                    placeholder="https://..."
                    onChange={(e) =>
                      setForm({
                        ...form,
                        liveDemoUrl: e.target.value.trim() || null,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-2 focus-visible:outline-accent"
                  />
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Optional. Public deployment or domain URL.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <InlineGalleryUploader
                bucket="projects"
                items={form.screenshots ?? []}
                onChange={(screenshots) => setForm({ ...form, screenshots })}
                label="Case Study Screenshots Gallery"
                testIdPrefix="project-gallery"
              />
            </div>

            <div
              className="mt-6 rounded-lg border border-border-token bg-surface/50 p-4"
              data-testid="categorized-technologies-manager"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-token/60 pb-3">
                <div>
                  <h3 className="text-xs font-semibold text-foreground">
                    Categorized Technologies (7 Categories)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Assign technologies to FE, BE, DB, API, ARCHITECTURE, DEVOPS & INFRA, or SOFTWARE QUALITY.
                  </p>
                </div>
              </div>

              {/* Add new technology control */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  aria-label="Technology Category"
                  data-testid="tech-category-select"
                  value={selectedTechCategory}
                  onChange={(e) =>
                    setSelectedTechCategory(e.target.value as TechnologyCategory)
                  }
                  className="rounded-md border border-border-token bg-background px-2.5 py-1.5 text-xs text-foreground font-mono"
                >
                  {TECHNOLOGY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="e.g. React, PostgreSQL, Docker..."
                  data-testid="tech-name-input"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTechnology();
                    }
                  }}
                  className="flex-1 min-w-[160px] rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  data-testid="tech-add-btn"
                  onClick={handleAddTechnology}
                  disabled={!newTechName.trim()}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Add
                </Button>
              </div>

              {/* 7 Categories display */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TECHNOLOGY_CATEGORIES.map((cat) => {
                  const itemsInCat = (form.categorizedTechnologies ?? [])
                    .map((item, originalIndex) => ({
                      ...item,
                      originalIndex,
                    }))
                    .filter((item) => item.category === cat);

                  return (
                    <div
                      key={cat}
                      data-testid={`tech-category-group-${cat
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "-")}`}
                      className="rounded-md border border-border-token/60 bg-background/80 p-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-border-token/40 pb-1 mb-2">
                        <span className="font-mono text-[10px] font-semibold uppercase text-accent">
                          {cat}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {itemsInCat.length}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                        {itemsInCat.length > 0 ? (
                          itemsInCat.map((item) => (
                            <span
                              key={`${item.category}-${item.name}-${item.originalIndex}`}
                              data-testid={`tech-pill-${item.originalIndex}`}
                              className="inline-flex items-center gap-1 rounded-full border border-border-token bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground"
                            >
                              <span>{item.name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveTechnology(item.originalIndex)
                                }
                                aria-label={`Remove ${item.name} from ${cat}`}
                                data-testid={`tech-remove-${item.originalIndex}`}
                                className="ml-0.5 text-muted-foreground hover:text-red-500 transition-colors"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic py-0.5">
                            No items
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                      {activeLanguage === "en" ? (
                        <input
                          type="text"
                          data-testid={`project-sec-title-en-${sec.sectionType}`}
                          value={sec.title}
                          onChange={(e) => {
                            const updated = [...form.caseStudySections];
                            updated[idx] = { ...sec, title: e.target.value };
                            setForm({ ...form, caseStudySections: updated });
                          }}
                          className="rounded border border-border-token bg-background px-2.5 py-1 text-xs font-semibold text-foreground"
                        />
                      ) : (
                        <input
                          type="text"
                          data-testid={`project-sec-title-id-${sec.sectionType}`}
                          value={sec.titleId ?? ""}
                          placeholder={sec.title || "Judul bagian (ID)"}
                          onChange={(e) => {
                            const updated = [...form.caseStudySections];
                            updated[idx] = { ...sec, titleId: e.target.value };
                            setForm({ ...form, caseStudySections: updated });
                          }}
                          className="rounded border border-border-token bg-background px-2.5 py-1 text-xs font-semibold text-foreground"
                        />
                      )}
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

                  {sec.isEnabled &&
                    (activeLanguage === "en" ? (
                      <textarea
                        rows={3}
                        data-testid={`project-sec-content-en-${sec.sectionType}`}
                        value={sec.content}
                        onChange={(e) => {
                          const updated = [...form.caseStudySections];
                          updated[idx] = { ...sec, content: e.target.value };
                          setForm({ ...form, caseStudySections: updated });
                        }}
                        placeholder={`Write verified engineering details for ${sec.title}...`}
                        className="mt-3 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                      />
                    ) : (
                      <textarea
                        rows={3}
                        data-testid={`project-sec-content-id-${sec.sectionType}`}
                        value={sec.contentId ?? ""}
                        placeholder={sec.content || `Tulis rincian rekayasa untuk ${sec.title} dalam Bahasa Indonesia...`}
                        onChange={(e) => {
                          const updated = [...form.caseStudySections];
                          updated[idx] = { ...sec, contentId: e.target.value };
                          setForm({ ...form, caseStudySections: updated });
                        }}
                        className="mt-3 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                      />
                    ))}
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
