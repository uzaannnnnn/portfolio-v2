"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  publishAboutAction,
  publishHeroAction,
  publishProfileAction,
  saveAboutDraftAction,
  saveHeroDraftAction,
  saveProfileDraftAction,
} from "@/features/admin/actions";
import type {
  RevisionRecord,
  VersionedEntityRecord,
} from "@/features/publishing/publishing-engine";
import type {
  AboutContent,
  HeroContent,
  ProfileData,
} from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminPageHeader,
  AdminStatusBanner,
} from "@/components/admin/admin-feedback";

export function ProfileEditor({
  entity,
  revisions,
}: {
  entity: VersionedEntityRecord<ProfileData>;
  revisions: RevisionRecord<unknown>[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileData>(entity.draftData);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  async function handleSaveDraft() {
    setBusy(true);
    const res = await saveProfileDraftAction(form, "Updated profile draft");
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handlePublish() {
    setBusy(true);
    const saved = await saveProfileDraftAction(
      form,
      "Pre-publish profile draft",
    );
    if (!saved.ok) {
      setBusy(false);
      setStatus({ ok: false, message: saved.message });
      return;
    }
    const pub = await publishProfileAction("Published profile update");
    setBusy(false);
    setStatus({ ok: pub.ok, message: pub.message });
    router.refresh();
  }

  return (
    <div data-testid="admin-profile-editor">
      <AdminPageHeader
        eyebrow="Content Management"
        title="Profile & Identity"
        description="Manage your primary engineering identity, availability badge, and verified contact channels."
        actions={
          <>
            <Badge
              variant={entity.status === "published" ? "accent" : "outline"}
            >
              {entity.status.toUpperCase()}
            </Badge>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={handleSaveDraft}
              data-testid="profile-save-draft-btn"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={handlePublish}
              data-testid="profile-publish-btn"
            >
              Publish Profile
            </Button>
          </>
        }
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Full Name
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Professional Title
              </label>
              <input
                type="text"
                value={form.professionalTitle}
                onChange={(e) =>
                  setForm({ ...form, professionalTitle: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Tagline
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Short Bio
            </label>
            <textarea
              rows={3}
              value={form.shortBio}
              onChange={(e) => setForm({ ...form, shortBio: e.target.value })}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Public Email (leave empty if unconfigured)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-foreground">
                GitHub URL
              </label>
              <input
                type="url"
                value={form.githubUrl}
                onChange={(e) =>
                  setForm({ ...form, githubUrl: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={form.linkedinUrl}
                onChange={(e) =>
                  setForm({ ...form, linkedinUrl: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Website URL
              </label>
              <input
                type="url"
                value={form.websiteUrl}
                onChange={(e) =>
                  setForm({ ...form, websiteUrl: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-border-token pt-4">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={form.availableForWork}
                onChange={(e) =>
                  setForm({ ...form, availableForWork: e.target.checked })
                }
              />
              <span>Available for Software Engineering Opportunities</span>
            </label>
            <input
              type="text"
              value={form.availabilityNote}
              onChange={(e) =>
                setForm({ ...form, availabilityNote: e.target.value })
              }
              placeholder="Availability note"
              className="flex-1 rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border-token bg-background p-6">
          <h2 className="text-sm font-semibold text-foreground">
            Live vs Draft Snapshot
          </h2>
          <p className="mt-1 text-xs text-secondary-foreground">
            Live Name:{" "}
            <strong className="text-foreground">
              {entity.publishedData?.fullName ?? "Unpublished"}
            </strong>
          </p>
          <p className="mt-1 text-xs text-secondary-foreground">
            Draft Revision:{" "}
            <code className="font-mono">{entity.draftRevisionId}</code>
          </p>
          <div className="mt-4 space-y-2 border-t border-border-token pt-4">
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Revision History ({revisions.length})
            </p>
            {revisions.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="rounded border border-border-token bg-surface p-2 text-[11px]"
              >
                <span className="font-mono font-semibold">
                  v{r.versionNumber} ({r.state})
                </span>{" "}
                — {r.changeSummary}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroEditor({
  entity,
}: {
  entity: VersionedEntityRecord<HeroContent>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<HeroContent>(entity.draftData);
  const [focusText, setFocusText] = useState(
    entity.draftData.engineeringFocusAreas.join("\n"),
  );
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  function buildPayload(): HeroContent {
    return {
      ...form,
      engineeringFocusAreas: focusText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  }

  async function handleSaveDraft() {
    setBusy(true);
    const res = await saveHeroDraftAction(buildPayload(), "Saved hero draft");
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handlePublish() {
    setBusy(true);
    const saved = await saveHeroDraftAction(
      buildPayload(),
      "Pre-publish hero draft",
    );
    if (!saved.ok) {
      setBusy(false);
      setStatus({ ok: false, message: saved.message });
      return;
    }
    const pub = await publishHeroAction("Published hero section");
    setBusy(false);
    setStatus({ ok: pub.ok, message: pub.message });
    router.refresh();
  }

  return (
    <div data-testid="admin-hero-editor">
      <AdminPageHeader
        eyebrow="Content Management"
        title="Hero Section"
        description="Configure the primary engineering headline, supporting positioning statement, CTAs, and focus areas."
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
              Publish Hero
            </Button>
          </>
        }
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="space-y-4 rounded-xl border border-border-token bg-background p-6">
        <div>
          <label className="block text-xs font-medium text-foreground">
            Eyebrow Label
          </label>
          <input
            type="text"
            value={form.eyebrow}
            onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
            className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground">
            Headline
          </label>
          <input
            type="text"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground">
            Supporting Description
          </label>
          <textarea
            rows={3}
            value={form.supportingDescription}
            onChange={(e) =>
              setForm({ ...form, supportingDescription: e.target.value })
            }
            className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-foreground">
              Primary CTA Label
            </label>
            <input
              type="text"
              value={form.primaryCtaLabel}
              onChange={(e) =>
                setForm({ ...form, primaryCtaLabel: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground">
              Primary CTA Href
            </label>
            <input
              type="text"
              value={form.primaryCtaHref}
              onChange={(e) =>
                setForm({ ...form, primaryCtaHref: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground">
            Engineering Focus Areas (One per line)
          </label>
          <textarea
            rows={4}
            value={focusText}
            onChange={(e) => setFocusText(e.target.value)}
            className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
          />
        </div>
      </div>
    </div>
  );
}

export function AboutEditor({
  entity,
}: {
  entity: VersionedEntityRecord<AboutContent>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<AboutContent>(entity.draftData);
  const [paragraphsText, setParagraphsText] = useState(
    entity.draftData.narrativeParagraphs.join("\n\n"),
  );
  const [domainsText, setDomainsText] = useState(
    entity.draftData.coreDomains.join(", "),
  );
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  function buildPayload(): AboutContent {
    return {
      ...form,
      narrativeParagraphs: paragraphsText
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean),
      coreDomains: domainsText
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
    };
  }

  async function handleSaveDraft() {
    setBusy(true);
    const res = await saveAboutDraftAction(buildPayload(), "Saved about draft");
    setBusy(false);
    setStatus({ ok: res.ok, message: res.message });
    router.refresh();
  }

  async function handlePublish() {
    setBusy(true);
    const saved = await saveAboutDraftAction(
      buildPayload(),
      "Pre-publish about draft",
    );
    if (!saved.ok) {
      setBusy(false);
      setStatus({ ok: false, message: saved.message });
      return;
    }
    const pub = await publishAboutAction("Published about & philosophy");
    setBusy(false);
    setStatus({ ok: pub.ok, message: pub.message });
    router.refresh();
  }

  return (
    <div data-testid="admin-about-editor">
      <AdminPageHeader
        eyebrow="Content Management"
        title="About & Engineering Philosophy"
        description="Edit your engineering narrative, core technical domains, and architectural pillars."
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
              Publish About
            </Button>
          </>
        }
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <div className="space-y-4 rounded-xl border border-border-token bg-background p-6">
        <div>
          <label className="block text-xs font-medium text-foreground">
            Introduction Statement
          </label>
          <textarea
            rows={2}
            value={form.introduction}
            onChange={(e) => setForm({ ...form, introduction: e.target.value })}
            className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground">
            Narrative Paragraphs (Separate with blank line)
          </label>
          <textarea
            rows={5}
            value={paragraphsText}
            onChange={(e) => setParagraphsText(e.target.value)}
            className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground">
            Core Domains (Comma-separated)
          </label>
          <input
            type="text"
            value={domainsText}
            onChange={(e) => setDomainsText(e.target.value)}
            className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
          />
        </div>
      </div>
    </div>
  );
}
