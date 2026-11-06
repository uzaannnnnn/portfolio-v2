-- ============================================================================
-- Migration: 00001_initial_schema.sql
-- Purpose: Normalized PostgreSQL schema for Muhamad Fauzan Portfolio CMS
-- Architecture: Explicit separation of draft_data and published_data projections
--               with append-only content_revisions, content_publications, and audit_logs.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 1. admin_users (Single-admin allowlist)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. content_revisions & content_publications & audit_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (
    entity_type IN (
      'profile',
      'site_settings',
      'hero_content',
      'about_content',
      'project',
      'skill_category',
      'skill',
      'experience',
      'education',
      'certification',
      'note',
      'boot_greeting',
      'resume_file'
    )
  ),
  entity_id TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  state TEXT NOT NULL CHECK (state IN ('draft', 'published', 'archived')),
  snapshot JSONB NOT NULL,
  change_summary TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_content_revisions_entity
  ON public.content_revisions (entity_type, entity_id, version_number DESC);

CREATE TABLE IF NOT EXISTS public.content_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  revision_id UUID REFERENCES public.content_revisions(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('publish', 'unpublish', 'archive', 'restore')),
  published_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_publications_entity
  ON public.content_publications (entity_type, entity_id, published_at DESC);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. singleton_configs (Unified projection + dedicated tables for profile, settings, hero, about)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.singleton_configs (
  key TEXT PRIMARY KEY CHECK (
    key IN ('profile', 'site_settings', 'hero_content', 'about_content')
  ),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_data JSONB,
  draft_data JSONB NOT NULL,
  published_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  draft_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_singleton_configs_updated_at
BEFORE UPDATE ON public.singleton_configs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  professional_title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  short_bio TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  github_url TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '',
  website_url TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  available_for_work BOOLEAN NOT NULL DEFAULT TRUE,
  availability_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_data JSONB,
  draft_data JSONB NOT NULL,
  published_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title TEXT NOT NULL,
  site_description TEXT NOT NULL,
  canonical_base_url TEXT NOT NULL,
  homepage_section_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  boot_welcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_data JSONB,
  draft_data JSONB NOT NULL,
  published_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.hero_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eyebrow TEXT NOT NULL,
  headline TEXT NOT NULL,
  supporting_description TEXT NOT NULL,
  primary_cta_label TEXT NOT NULL,
  primary_cta_href TEXT NOT NULL,
  secondary_cta_label TEXT NOT NULL,
  secondary_cta_href TEXT NOT NULL,
  engineering_focus_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_data JSONB,
  draft_data JSONB NOT NULL,
  published_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_hero_contents_updated_at
BEFORE UPDATE ON public.hero_contents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.about_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  introduction TEXT NOT NULL,
  narrative_paragraphs JSONB NOT NULL DEFAULT '[]'::jsonb,
  engineering_philosophy_title TEXT NOT NULL,
  engineering_philosophy_subtitle TEXT NOT NULL,
  engineering_pillars JSONB NOT NULL DEFAULT '[]'::jsonb,
  core_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_data JSONB,
  draft_data JSONB NOT NULL,
  published_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_about_contents_updated_at
BEFORE UPDATE ON public.about_contents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. skill_categories & skills
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_categories_order
  ON public.skill_categories (is_enabled, display_order ASC);

CREATE TRIGGER trg_skill_categories_updated_at
BEFORE UPDATE ON public.skill_categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.skill_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  proficiency TEXT CHECK (
    proficiency IS NULL OR proficiency IN ('Core', 'Proficient', 'Working Knowledge', 'Exploring')
  ),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_category_order
  ON public.skills (category_id, status, is_enabled, display_order ASC);

CREATE TRIGGER trg_skills_updated_at
BEFORE UPDATE ON public.skills
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. media_assets & resume_files
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL CHECK (
    bucket IN ('profile', 'projects', 'certificates', 'resume', 'articles', 'og-images')
  ),
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  alt_text TEXT NOT NULL DEFAULT '',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_media_assets_updated_at
BEFORE UPDATE ON public.media_assets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.resume_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_label TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  file_url TEXT,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  summary_note TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_files_active
  ON public.resume_files (status, is_active);

CREATE TRIGGER trg_resume_files_updated_at
BEFORE UPDATE ON public.resume_files
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. projects, project_technologies, project_sections
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  cover_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  published_data JSONB,
  draft_data JSONB NOT NULL,
  published_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  draft_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status_order
  ON public.projects (status, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_projects_slug_status
  ON public.projects (slug, status);

CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.project_technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_technologies_project
  ON public.project_technologies (project_id, display_order ASC);

CREATE TABLE IF NOT EXISTS public.project_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (
    section_type IN (
      'overview',
      'problem',
      'objectives',
      'solution',
      'architecture',
      'implementation',
      'database',
      'api',
      'challenges',
      'tradeoffs',
      'testing',
      'deployment',
      'results',
      'lessons'
    )
  ),
  title TEXT NOT NULL,
  content_mdx TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_sections_project
  ON public.project_sections (project_id, is_enabled, display_order ASC);

CREATE TRIGGER trg_project_sections_updated_at
BEFORE UPDATE ON public.project_sections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. experiences, educations, certifications, notes, boot_greetings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization TEXT NOT NULL,
  role TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (
    employment_type IN ('Internship', 'Full-time', 'Part-time', 'Freelance', 'Contract')
  ),
  work_system TEXT NOT NULL CHECK (work_system IN ('Onsite', 'Remote', 'Hybrid')),
  location TEXT NOT NULL DEFAULT '',
  start_month INTEGER NOT NULL CHECK (start_month BETWEEN 1 AND 12),
  start_year INTEGER NOT NULL CHECK (start_year >= 1990),
  end_month INTEGER CHECK (end_month IS NULL OR (end_month BETWEEN 1 AND 12)),
  end_year INTEGER CHECK (end_year IS NULL OR end_year >= 1990),
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_data JSONB,
  draft_data JSONB NOT NULL,
  published_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experiences_status_order
  ON public.experiences (status, display_order ASC);

CREATE TRIGGER trg_experiences_updated_at
BEFORE UPDATE ON public.experiences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  major TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_data JSONB,
  draft_data JSONB NOT NULL,
  published_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_educations_status_order
  ON public.educations (status, display_order ASC);

CREATE TRIGGER trg_educations_updated_at
BEFORE UPDATE ON public.educations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_month INTEGER NOT NULL CHECK (issue_month BETWEEN 1 AND 12),
  issue_year INTEGER NOT NULL CHECK (issue_year >= 1990),
  expiration_month INTEGER CHECK (expiration_month IS NULL OR (expiration_month BETWEEN 1 AND 12)),
  expiration_year INTEGER CHECK (expiration_year IS NULL OR expiration_year >= 1990),
  credential_id TEXT,
  credential_url TEXT,
  certificate_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_data JSONB,
  draft_data JSONB NOT NULL,
  published_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certifications_status_order
  ON public.certifications (status, display_order ASC);

CREATE TRIGGER trg_certifications_updated_at
BEFORE UPDATE ON public.certifications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Engineering',
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  cover_media_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  published_data JSONB,
  draft_data JSONB NOT NULL,
  published_revision_id UUID REFERENCES public.content_revisions(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_status_order
  ON public.notes (status, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_notes_slug_status
  ON public.notes (slug, status);

CREATE TRIGGER trg_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.boot_greetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL,
  greeting TEXT NOT NULL,
  meaning TEXT NOT NULL,
  region_note TEXT NOT NULL DEFAULT '',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boot_greetings_public
  ON public.boot_greetings (status, is_enabled, display_order ASC);

CREATE TRIGGER trg_boot_greetings_updated_at
BEFORE UPDATE ON public.boot_greetings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
