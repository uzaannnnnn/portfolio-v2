-- =============================================================================
-- Migration 00005: Manual Bilingual Content Management Support (EN + ID)
-- Strictly manual localization: English primary + optional Bahasa Indonesia.
-- Backward-compatible: preserves all existing English records, draft_data,
-- published_data, and content_revisions snapshots without destructive changes.
-- =============================================================================

-- 1. Boot Greetings localized columns
ALTER TABLE public.boot_greetings
  ADD COLUMN IF NOT EXISTS meaning_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS region_note_id TEXT NOT NULL DEFAULT '';

-- 2. Skill Categories localized columns
ALTER TABLE public.skill_categories
  ADD COLUMN IF NOT EXISTS name_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_id TEXT NOT NULL DEFAULT '';

-- 3. Profiles localized columns (mirrors JSONB draft_data / published_data)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS professional_title_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tagline_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS short_bio_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS location_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS availability_note_id TEXT NOT NULL DEFAULT '';

-- 4. Site Settings localized columns
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS site_title_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS site_description_id TEXT NOT NULL DEFAULT '';

-- 5. Hero Contents localized columns
ALTER TABLE public.hero_contents
  ADD COLUMN IF NOT EXISTS eyebrow_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS headline_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS supporting_description_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS primary_cta_label_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS secondary_cta_label_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS engineering_focus_areas_id JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 6. About Contents localized columns
ALTER TABLE public.about_contents
  ADD COLUMN IF NOT EXISTS introduction_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS narrative_paragraphs_id JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS engineering_philosophy_title_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS engineering_philosophy_subtitle_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS core_domains_id JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 7. Projects & Project Sections localized columns
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS category_id TEXT NOT NULL DEFAULT '';

ALTER TABLE public.project_sections
  ADD COLUMN IF NOT EXISTS title_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS content_mdx_id TEXT NOT NULL DEFAULT '';

-- 8. Experiences, Educations, Certifications, Notes localized columns
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS role_id TEXT NOT NULL DEFAULT '';

ALTER TABLE public.educations
  ADD COLUMN IF NOT EXISTS degree_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS major_id TEXT NOT NULL DEFAULT '';

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS title_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category_id TEXT NOT NULL DEFAULT '';

