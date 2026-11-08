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
  LanguagePreference,
  ProfileData,
} from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminLanguageTabs,
  AdminPageHeader,
  AdminStatusBanner,
} from "@/components/admin/admin-feedback";
import {
  getAboutCompleteness,
  getHeroCompleteness,
  getProfileCompleteness,
} from "@/lib/i18n/localization";
import { InlineMediaUploader } from "@/components/admin/inline-media-uploader";
import { EducationManager } from "@/components/admin/collection-managers";
import type { EducationItem } from "@/types/portfolio";
import { Sparkles, User, BookOpen, GraduationCap } from "lucide-react";

export function ProfileEditor({
  entity,
  revisions,
}: {
  entity: VersionedEntityRecord<ProfileData>;
  revisions: RevisionRecord<unknown>[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileData>(entity.draftData);
  const [activeLanguage, setActiveLanguage] = useState<LanguagePreference>("en");
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

  const completeness = getProfileCompleteness(form);

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

      <AdminLanguageTabs
        activeLanguage={activeLanguage}
        onSelectLanguage={setActiveLanguage}
        completeness={completeness}
        testIdPrefix="profile"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-border-token bg-background p-6 lg:col-span-2">
          <div className="border-b border-border-token pb-4">
            <InlineMediaUploader
              bucket="profile"
              value={form.avatarUrl}
              onChange={(url) => setForm({ ...form, avatarUrl: url })}
              label="Avatar / Profile Photo (Shared)"
              helperText="Upload PNG, JPG, WebP or AVIF up to 5 MB directly from device"
              testIdPrefix="profile-avatar"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                Full Name (Shared)
              </label>
              <input
                type="text"
                data-testid="profile-fullname-input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                {activeLanguage === "en"
                  ? "Professional Title (English — Required)"
                  : "Professional Title (Bahasa Indonesia)"}
              </label>
              {activeLanguage === "en" ? (
                <input
                  type="text"
                  data-testid="profile-title-en-input"
                  value={form.professionalTitle}
                  onChange={(e) =>
                    setForm({ ...form, professionalTitle: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              ) : (
                <input
                  type="text"
                  data-testid="profile-title-id-input"
                  value={form.professionalTitleId ?? ""}
                  placeholder={form.professionalTitle || "Masukkan jabatan profesional dalam Bahasa Indonesia..."}
                  onChange={(e) =>
                    setForm({ ...form, professionalTitleId: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en"
                ? "Tagline (English — Required)"
                : "Tagline (Bahasa Indonesia)"}
            </label>
            {activeLanguage === "en" ? (
              <input
                type="text"
                data-testid="profile-tagline-en-input"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            ) : (
              <input
                type="text"
                data-testid="profile-tagline-id-input"
                value={form.taglineId ?? ""}
                placeholder={form.tagline || "Masukkan tagline dalam Bahasa Indonesia..."}
                onChange={(e) => setForm({ ...form, taglineId: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en"
                ? "Short Bio (English — Required)"
                : "Short Bio (Bahasa Indonesia)"}
            </label>
            {activeLanguage === "en" ? (
              <textarea
                rows={3}
                data-testid="profile-shortbio-en-input"
                value={form.shortBio}
                onChange={(e) => setForm({ ...form, shortBio: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            ) : (
              <textarea
                rows={3}
                data-testid="profile-shortbio-id-input"
                value={form.shortBioId ?? ""}
                placeholder={form.shortBio || "Masukkan bio singkat dalam Bahasa Indonesia..."}
                onChange={(e) => setForm({ ...form, shortBioId: e.target.value })}
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground">
                {activeLanguage === "en"
                  ? "Location (English — Required)"
                  : "Location (Bahasa Indonesia)"}
              </label>
              {activeLanguage === "en" ? (
                <input
                  type="text"
                  data-testid="profile-location-en-input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              ) : (
                <input
                  type="text"
                  data-testid="profile-location-id-input"
                  value={form.locationId ?? ""}
                  placeholder={form.location || "Masukkan lokasi dalam Bahasa Indonesia..."}
                  onChange={(e) =>
                    setForm({ ...form, locationId: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Public Email (Shared — leave empty if unconfigured)
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
                GitHub URL (Shared)
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
                LinkedIn URL (Shared)
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
                Website URL (Shared)
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

          <div className="space-y-3 border-t border-border-token pt-4">
            <p className="text-xs font-semibold text-foreground">
              Contact & Availability Section ({activeLanguage === "en" ? "English" : "Bahasa Indonesia"})
            </p>
            <div className="flex flex-wrap items-center gap-4">
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
              {activeLanguage === "en" ? (
                <input
                  type="text"
                  data-testid="profile-availability-en-input"
                  value={form.availabilityNote}
                  onChange={(e) =>
                    setForm({ ...form, availabilityNote: e.target.value })
                  }
                  placeholder="Availability / Invitation message (EN)"
                  className="flex-1 rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
                />
              ) : (
                <input
                  type="text"
                  data-testid="profile-availability-id-input"
                  value={form.availabilityNoteId ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, availabilityNoteId: e.target.value })
                  }
                  placeholder={form.availabilityNote || "Pesan ketersediaan / undangan kolaborasi (ID)"}
                  className="flex-1 rounded-md border border-border-token bg-background px-3 py-1.5 text-xs text-foreground"
                />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-foreground">
                  {activeLanguage === "en"
                    ? "Contact Heading Override (Optional EN)"
                    : "Contact Heading Override (Optional ID)"}
                </label>
                {activeLanguage === "en" ? (
                  <input
                    type="text"
                    data-testid="profile-contact-heading-en-input"
                    value={form.contactHeading ?? ""}
                    placeholder="Contact"
                    onChange={(e) =>
                      setForm({ ...form, contactHeading: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                  />
                ) : (
                  <input
                    type="text"
                    data-testid="profile-contact-heading-id-input"
                    value={form.contactHeadingId ?? ""}
                    placeholder={form.contactHeading || "Kontak"}
                    onChange={(e) =>
                      setForm({ ...form, contactHeadingId: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground">
                  {activeLanguage === "en"
                    ? "Contact Supporting Text (Optional EN)"
                    : "Contact Supporting Text (Optional ID)"}
                </label>
                {activeLanguage === "en" ? (
                  <input
                    type="text"
                    data-testid="profile-contact-support-en-input"
                    value={form.contactSupportText ?? ""}
                    placeholder="Optional supporting text below contact heading"
                    onChange={(e) =>
                      setForm({ ...form, contactSupportText: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                  />
                ) : (
                  <input
                    type="text"
                    data-testid="profile-contact-support-id-input"
                    value={form.contactSupportTextId ?? ""}
                    placeholder={form.contactSupportText || "Teks pendukung bagian kontak (ID)"}
                    onChange={(e) =>
                      setForm({ ...form, contactSupportTextId: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
                  />
                )}
              </div>
            </div>
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
  const [activeLanguage, setActiveLanguage] = useState<LanguagePreference>("en");
  const [focusTextEn, setFocusTextEn] = useState(
    entity.draftData.engineeringFocusAreas.join("\n"),
  );
  const [focusTextId, setFocusTextId] = useState(
    (entity.draftData.engineeringFocusAreasId ?? []).join("\n"),
  );
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  function buildPayload(): HeroContent {
    return {
      ...form,
      engineeringFocusAreas: focusTextEn
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      engineeringFocusAreasId: focusTextId
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

  const payload = buildPayload();
  const completeness = getHeroCompleteness(payload);

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
              data-testid="hero-save-draft-btn"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={handlePublish}
              data-testid="hero-publish-btn"
            >
              Publish Hero
            </Button>
          </>
        }
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <AdminLanguageTabs
        activeLanguage={activeLanguage}
        onSelectLanguage={setActiveLanguage}
        completeness={completeness}
        testIdPrefix="hero"
      />

      <div className="space-y-4 rounded-xl border border-border-token bg-background p-6">
        <div>
          <label className="block text-xs font-medium text-foreground">
            {activeLanguage === "en"
              ? "Eyebrow Label (English — Required)"
              : "Eyebrow Label (Bahasa Indonesia)"}
          </label>
          {activeLanguage === "en" ? (
            <input
              type="text"
              data-testid="hero-eyebrow-en-input"
              value={form.eyebrow}
              onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          ) : (
            <input
              type="text"
              data-testid="hero-eyebrow-id-input"
              value={form.eyebrowId ?? ""}
              placeholder={form.eyebrow || "Masukkan label eyebrow dalam Bahasa Indonesia..."}
              onChange={(e) => setForm({ ...form, eyebrowId: e.target.value })}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground">
            {activeLanguage === "en"
              ? "Headline (English — Required)"
              : "Headline (Bahasa Indonesia)"}
          </label>
          {activeLanguage === "en" ? (
            <input
              type="text"
              data-testid="hero-headline-en-input"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          ) : (
            <input
              type="text"
              data-testid="hero-headline-id-input"
              value={form.headlineId ?? ""}
              placeholder={form.headline || "Masukkan headline dalam Bahasa Indonesia..."}
              onChange={(e) => setForm({ ...form, headlineId: e.target.value })}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground">
            {activeLanguage === "en"
              ? "Supporting Description (English — Required)"
              : "Supporting Description (Bahasa Indonesia)"}
          </label>
          {activeLanguage === "en" ? (
            <textarea
              rows={3}
              data-testid="hero-desc-en-input"
              value={form.supportingDescription}
              onChange={(e) =>
                setForm({ ...form, supportingDescription: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          ) : (
            <textarea
              rows={3}
              data-testid="hero-desc-id-input"
              value={form.supportingDescriptionId ?? ""}
              placeholder={form.supportingDescription || "Deskripsi pendukung hero dalam Bahasa Indonesia..."}
              onChange={(e) =>
                setForm({ ...form, supportingDescriptionId: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en"
                ? "Primary CTA Label (English — Required)"
                : "Primary CTA Label (Bahasa Indonesia)"}
            </label>
            {activeLanguage === "en" ? (
              <input
                type="text"
                data-testid="hero-primary-cta-label-en-input"
                value={form.primaryCtaLabel}
                onChange={(e) =>
                  setForm({ ...form, primaryCtaLabel: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            ) : (
              <input
                type="text"
                data-testid="hero-primary-cta-label-id-input"
                value={form.primaryCtaLabelId ?? ""}
                placeholder={form.primaryCtaLabel || "Label CTA Utama"}
                onChange={(e) =>
                  setForm({ ...form, primaryCtaLabelId: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground">
              Primary CTA Href (Shared)
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en"
                ? "Secondary CTA Label (English — Required)"
                : "Secondary CTA Label (Bahasa Indonesia)"}
            </label>
            {activeLanguage === "en" ? (
              <input
                type="text"
                data-testid="hero-secondary-cta-label-en-input"
                value={form.secondaryCtaLabel}
                onChange={(e) =>
                  setForm({ ...form, secondaryCtaLabel: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            ) : (
              <input
                type="text"
                data-testid="hero-secondary-cta-label-id-input"
                value={form.secondaryCtaLabelId ?? ""}
                placeholder={form.secondaryCtaLabel || "Label CTA Sekunder"}
                onChange={(e) =>
                  setForm({ ...form, secondaryCtaLabelId: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground">
              Secondary CTA Href (Shared)
            </label>
            <input
              type="text"
              value={form.secondaryCtaHref}
              onChange={(e) =>
                setForm({ ...form, secondaryCtaHref: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground">
            {activeLanguage === "en"
              ? "Engineering Focus Areas (English — One per line)"
              : "Engineering Focus Areas (Bahasa Indonesia — One per line)"}
          </label>
          {activeLanguage === "en" ? (
            <textarea
              rows={4}
              data-testid="hero-focus-en-input"
              value={focusTextEn}
              onChange={(e) => setFocusTextEn(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
            />
          ) : (
            <textarea
              rows={4}
              data-testid="hero-focus-id-input"
              value={focusTextId}
              placeholder={focusTextEn || "Fokus rekayasa dalam Bahasa Indonesia (satu per baris)..."}
              onChange={(e) => setFocusTextId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 font-mono text-xs text-foreground"
            />
          )}
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
  const [activeLanguage, setActiveLanguage] = useState<LanguagePreference>("en");
  const [paragraphsTextEn, setParagraphsTextEn] = useState(
    entity.draftData.narrativeParagraphs.join("\n\n"),
  );
  const [paragraphsTextId, setParagraphsTextId] = useState(
    (entity.draftData.narrativeParagraphsId ?? []).join("\n\n"),
  );
  const [domainsTextEn, setDomainsTextEn] = useState(
    entity.draftData.coreDomains.join(", "),
  );
  const [domainsTextId, setDomainsTextId] = useState(
    (entity.draftData.coreDomainsId ?? []).join(", "),
  );
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  function buildPayload(): AboutContent {
    return {
      ...form,
      narrativeParagraphs: paragraphsTextEn
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean),
      narrativeParagraphsId: paragraphsTextId
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean),
      coreDomains: domainsTextEn
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
      coreDomainsId: domainsTextId
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

  const payload = buildPayload();
  const completeness = getAboutCompleteness(payload);

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
              data-testid="about-save-draft-btn"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={handlePublish}
              data-testid="about-publish-btn"
            >
              Publish About
            </Button>
          </>
        }
      />

      <AdminStatusBanner status={status} onDismiss={() => setStatus(null)} />

      <AdminLanguageTabs
        activeLanguage={activeLanguage}
        onSelectLanguage={setActiveLanguage}
        completeness={completeness}
        testIdPrefix="about"
      />

      <div className="space-y-4 rounded-xl border border-border-token bg-background p-6">
        <div>
          <label className="block text-xs font-medium text-foreground">
            {activeLanguage === "en"
              ? "Introduction Statement (English — Required)"
              : "Introduction Statement (Bahasa Indonesia)"}
          </label>
          {activeLanguage === "en" ? (
            <textarea
              rows={2}
              data-testid="about-intro-en-input"
              value={form.introduction}
              onChange={(e) => setForm({ ...form, introduction: e.target.value })}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          ) : (
            <textarea
              rows={2}
              data-testid="about-intro-id-input"
              value={form.introductionId ?? ""}
              placeholder={form.introduction || "Pernyataan pengantar dalam Bahasa Indonesia..."}
              onChange={(e) => setForm({ ...form, introductionId: e.target.value })}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground">
            {activeLanguage === "en"
              ? "Narrative Paragraphs (English — Separate with blank line)"
              : "Narrative Paragraphs (Bahasa Indonesia — Separate with blank line)"}
          </label>
          {activeLanguage === "en" ? (
            <textarea
              rows={5}
              data-testid="about-narrative-en-input"
              value={paragraphsTextEn}
              onChange={(e) => setParagraphsTextEn(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          ) : (
            <textarea
              rows={5}
              data-testid="about-narrative-id-input"
              value={paragraphsTextId}
              placeholder={paragraphsTextEn || "Paragraf narasi dalam Bahasa Indonesia..."}
              onChange={(e) => setParagraphsTextId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground">
            {activeLanguage === "en"
              ? "Core Domains (English — Comma-separated)"
              : "Core Domains (Bahasa Indonesia — Comma-separated)"}
          </label>
          {activeLanguage === "en" ? (
            <input
              type="text"
              data-testid="about-domains-en-input"
              value={domainsTextEn}
              onChange={(e) => setDomainsTextEn(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          ) : (
            <input
              type="text"
              data-testid="about-domains-id-input"
              value={domainsTextId}
              placeholder={domainsTextEn || "Domain utama, koma dipisah"}
              onChange={(e) => setDomainsTextId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en"
                ? "Philosophy Title (English — Required)"
                : "Philosophy Title (Bahasa Indonesia)"}
            </label>
            {activeLanguage === "en" ? (
              <input
                type="text"
                data-testid="about-phil-title-en-input"
                value={form.engineeringPhilosophyTitle}
                onChange={(e) =>
                  setForm({ ...form, engineeringPhilosophyTitle: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            ) : (
              <input
                type="text"
                data-testid="about-phil-title-id-input"
                value={form.engineeringPhilosophyTitleId ?? ""}
                placeholder={form.engineeringPhilosophyTitle || "Judul filosofi rekayasa (ID)"}
                onChange={(e) =>
                  setForm({ ...form, engineeringPhilosophyTitleId: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground">
              {activeLanguage === "en"
                ? "Philosophy Subtitle (English — Required)"
                : "Philosophy Subtitle (Bahasa Indonesia)"}
            </label>
            {activeLanguage === "en" ? (
              <input
                type="text"
                data-testid="about-phil-sub-en-input"
                value={form.engineeringPhilosophySubtitle}
                onChange={(e) =>
                  setForm({ ...form, engineeringPhilosophySubtitle: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            ) : (
              <input
                type="text"
                data-testid="about-phil-sub-id-input"
                value={form.engineeringPhilosophySubtitleId ?? ""}
                placeholder={form.engineeringPhilosophySubtitle || "Subjudul filosofi rekayasa (ID)"}
                onChange={(e) =>
                  setForm({ ...form, engineeringPhilosophySubtitleId: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-border-token bg-background px-3 py-2 text-xs text-foreground"
              />
            )}
          </div>
        </div>

        <div className="space-y-3 border-t border-border-token pt-4">
          <p className="text-xs font-semibold text-foreground">
            Engineering Approach / Pillars ({form.engineeringPillars.length}) — {activeLanguage === "en" ? "English" : "Bahasa Indonesia"}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {form.engineeringPillars.map((pillar, idx) => (
              <div
                key={pillar.id}
                className="space-y-2 rounded-lg border border-border-token bg-surface p-3"
              >
                <div>
                  <label className="block text-[11px] font-medium text-foreground">
                    Pillar #{idx + 1} Title {activeLanguage === "en" ? "(EN)" : "(ID)"}
                  </label>
                  {activeLanguage === "en" ? (
                    <input
                      type="text"
                      data-testid={`about-pillar-title-en-${idx}`}
                      value={pillar.title}
                      onChange={(e) => {
                        const next = [...form.engineeringPillars];
                        next[idx] = { ...pillar, title: e.target.value };
                        setForm({ ...form, engineeringPillars: next });
                      }}
                      className="mt-1 w-full rounded border border-border-token bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  ) : (
                    <input
                      type="text"
                      data-testid={`about-pillar-title-id-${idx}`}
                      value={pillar.titleId ?? ""}
                      placeholder={pillar.title || "Judul pilar (ID)"}
                      onChange={(e) => {
                        const next = [...form.engineeringPillars];
                        next[idx] = { ...pillar, titleId: e.target.value };
                        setForm({ ...form, engineeringPillars: next });
                      }}
                      className="mt-1 w-full rounded border border-border-token bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-foreground">
                    Summary {activeLanguage === "en" ? "(EN)" : "(ID)"}
                  </label>
                  {activeLanguage === "en" ? (
                    <textarea
                      rows={3}
                      data-testid={`about-pillar-summary-en-${idx}`}
                      value={pillar.summary}
                      onChange={(e) => {
                        const next = [...form.engineeringPillars];
                        next[idx] = { ...pillar, summary: e.target.value };
                        setForm({ ...form, engineeringPillars: next });
                      }}
                      className="mt-1 w-full rounded border border-border-token bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  ) : (
                    <textarea
                      rows={3}
                      data-testid={`about-pillar-summary-id-${idx}`}
                      value={pillar.summaryId ?? ""}
                      placeholder={pillar.summary || "Ringkasan pilar (ID)"}
                      onChange={(e) => {
                        const next = [...form.engineeringPillars];
                        next[idx] = { ...pillar, summaryId: e.target.value };
                        setForm({ ...form, engineeringPillars: next });
                      }}
                      className="mt-1 w-full rounded border border-border-token bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export type ProfileSubTab = "identity" | "hero" | "about" | "education";

export function UnifiedProfileManager({
  profileEntity,
  heroEntity,
  aboutEntity,
  educationItems,
  revisions,
  initialTab = "identity",
}: {
  profileEntity: VersionedEntityRecord<ProfileData>;
  heroEntity: VersionedEntityRecord<HeroContent>;
  aboutEntity: VersionedEntityRecord<AboutContent>;
  educationItems: VersionedEntityRecord<EducationItem>[];
  revisions: RevisionRecord<unknown>[];
  initialTab?: string;
}) {
  const validTabs: ProfileSubTab[] = ["identity", "hero", "about", "education"];
  const [activeTab, setActiveTab] = useState<ProfileSubTab>(
    validTabs.includes(initialTab as ProfileSubTab)
      ? (initialTab as ProfileSubTab)
      : "identity",
  );

  const profileRevs = revisions.filter((r) => r.entityType === "profile");

  const tabs: Array<{ id: ProfileSubTab; label: string; icon: typeof User }> = [
    { id: "identity", label: "Identity & Social", icon: User },
    { id: "hero", label: "Hero Information", icon: Sparkles },
    { id: "about", label: "Me Content", icon: BookOpen },
    { id: "education", label: "Educational Background", icon: GraduationCap },
  ];

  return (
    <div className="space-y-6" data-testid="unified-profile-manager">
      {/* Sub-tab navigation bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-token bg-surface p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              data-testid={`profile-subtab-${tab.id}`}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-background text-foreground shadow-sm border border-border-token"
                  : "text-secondary-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-accent" : ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "identity" && (
        <ProfileEditor entity={profileEntity} revisions={profileRevs} />
      )}
      {activeTab === "hero" && (
        <HeroEditor entity={heroEntity} />
      )}
      {activeTab === "about" && (
        <AboutEditor entity={aboutEntity} />
      )}
      {activeTab === "education" && (
        <EducationManager items={educationItems} />
      )}
    </div>
  );
}
