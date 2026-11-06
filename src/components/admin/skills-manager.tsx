"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  deleteSkillCategoryAction,
  saveSkillCategoryAction,
} from "@/features/admin/actions";
import type { SkillCategory, SkillItem } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminConfirmDialog,
  AdminPageHeader,
  AdminStatusBanner,
} from "@/components/admin/admin-feedback";

type SkillProficiency = NonNullable<SkillItem["proficiency"]>;

const PROFICIENCIES: SkillProficiency[] = [
  "Core",
  "Proficient",
  "Working Knowledge",
  "Exploring",
];

export function SkillsManager({
  initialCategories,
}: {
  initialCategories: SkillCategory[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(
    initialCategories[0]?.id ?? "",
  );
  const activeCat =
    initialCategories.find((c) => c.id === selectedId) ?? initialCategories[0];

  const [catForm, setCatForm] = useState<SkillCategory>(
    activeCat ?? {
      id: "cat-new",
      name: "New Category",
      slug: "new-category",
      description: "",
      displayOrder: initialCategories.length + 1,
      isEnabled: true,
      skills: [],
    },
  );
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillProf, setNewSkillProf] = useState<SkillProficiency>("Core");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function selectCategory(cat: SkillCategory) {
    setSelectedId(cat.id);
    setCatForm(structuredClone(cat));
  }

  function handleAddSkill() {
    if (!newSkillName.trim()) return;
    const item: SkillItem = {
      id: `skill-${Date.now()}`,
      categoryId: catForm.id,
      name: newSkillName.trim(),
      proficiency: newSkillProf,
      isEnabled: true,
      displayOrder: catForm.skills.length + 1,
      status: "published",
    };
    setCatForm({
      ...catForm,
      skills: [...catForm.skills, item],
    });
    setNewSkillName("");
  }

  function handleRemoveSkill(skillId: string) {
    setCatForm({
      ...catForm,
      skills: catForm.skills.filter((s) => s.id !== skillId),
    });
  }

  async function handleSaveCategory() {
    setBusy(true);
    const res = await saveSkillCategoryAction(catForm);
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    setBusy(true);
    const res = await deleteSkillCategoryAction(deleteTargetId);
    setBusy(false);
    setDeleteTargetId(null);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  return (
    <div data-testid="admin-skills-manager">
      <AdminPageHeader
        eyebrow="Content Management"
        title="Skills & Technical Categories"
        description="Manage structured technical skill groups, honest proficiency labels, and display order without arbitrary percentage bars."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const created: SkillCategory = {
                id: `cat-${Date.now()}`,
                name: "Additional Engineering Domain",
                slug: `domain-${Date.now()}`,
                description: "Technical capabilities and tooling.",
                displayOrder: initialCategories.length + 1,
                isEnabled: true,
                skills: [],
              };
              setSelectedId(created.id);
              setCatForm(created);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            New Category
          </Button>
        }
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category Selector List */}
        <div className="space-y-2 rounded-xl border border-border-token bg-background p-4">
          <p className="font-mono text-[11px] uppercase text-muted-foreground">
            Skill Categories ({initialCategories.length})
          </p>
          {initialCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => selectCategory(cat)}
              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-xs transition-colors ${
                catForm.id === cat.id
                  ? "border-accent bg-surface font-semibold text-foreground"
                  : "border-border-token bg-background text-secondary-foreground hover:bg-surface"
              }`}
            >
              <span>{cat.name}</span>
              <Badge variant="outline">{cat.skills.length}</Badge>
            </button>
          ))}
        </div>

        {/* Category Editor */}
        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Category Name
              </label>
              <input
                type="text"
                value={catForm.name}
                onChange={(e) =>
                  setCatForm({ ...catForm, name: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Slug (kebab-case)
              </label>
              <input
                type="text"
                value={catForm.slug}
                onChange={(e) =>
                  setCatForm({ ...catForm, slug: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
              />
            </div>
          </div>

          <div className="border-t border-border-token pt-4">
            <p className="text-xs font-semibold text-foreground">
              Skills in {catForm.name} ({catForm.skills.length})
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Add skill (e.g., GraphQL)"
                data-testid="new-skill-input"
                className="flex-1 rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
              />
              <select
                value={newSkillProf}
                onChange={(e) =>
                  setNewSkillProf(e.target.value as SkillProficiency)
                }
                className="rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
              >
                {PROFICIENCIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddSkill}
                data-testid="add-skill-btn"
              >
                Add Skill
              </Button>
            </div>

            <div className="mt-4 divide-y divide-border-token rounded-lg border border-border-token">
              {catForm.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {skill.name}
                    </span>
                    <Badge variant="outline">{skill.proficiency ?? "Core"}</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill.id)}
                    aria-label={`Remove ${skill.name}`}
                    className="text-muted-foreground hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border-token pt-4">
            <button
              type="button"
              onClick={() => setDeleteTargetId(catForm.id)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Delete Category
            </button>
            <Button
              type="button"
              disabled={busy}
              onClick={handleSaveCategory}
              data-testid="save-skill-category-btn"
            >
              Save Category & Skills
            </Button>
          </div>
        </div>
      </div>

      <AdminConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Delete Skill Category?"
        description="This removes the skill category from the portfolio. Audit logs remain preserved."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
