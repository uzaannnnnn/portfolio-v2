-- ============================================================================
-- Migration: 00002_rls_and_storage_policies.sql
-- Purpose: Database-level Row-Level Security (RLS) for all 19 CMS tables,
--          Supabase Storage bucket provisioning + access policies, and
--          transactional publishing stored procedures.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Single-Admin Verification Helper (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.auth_user_id = auth.uid()
      AND au.is_active = TRUE
      AND au.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Enable Row-Level Security on All 19 Tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.singleton_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boot_greetings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. Admin-Only Private Tables (Zero Public Access)
-- ----------------------------------------------------------------------------
CREATE POLICY "admin_users_self_or_admin_select"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "content_revisions_admin_all"
  ON public.content_revisions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "content_publications_admin_all"
  ON public.content_publications
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "audit_logs_admin_select_insert"
  ON public.audit_logs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. Publishable Content Tables:
--    - Public (anon + authenticated): SELECT only when status = 'published'
--    - Admin (authenticated + is_admin()): ALL operations (SELECT drafts, INSERT, UPDATE, DELETE)
-- ----------------------------------------------------------------------------

-- singleton_configs
CREATE POLICY "singleton_configs_public_read_published"
  ON public.singleton_configs
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_data IS NOT NULL);

CREATE POLICY "singleton_configs_admin_all"
  ON public.singleton_configs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- profiles
CREATE POLICY "profiles_public_read_published"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_data IS NOT NULL);

CREATE POLICY "profiles_admin_all"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- site_settings
CREATE POLICY "site_settings_public_read_published"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_data IS NOT NULL);

CREATE POLICY "site_settings_admin_all"
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- hero_contents
CREATE POLICY "hero_contents_public_read_published"
  ON public.hero_contents
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_data IS NOT NULL);

CREATE POLICY "hero_contents_admin_all"
  ON public.hero_contents
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- about_contents
CREATE POLICY "about_contents_public_read_published"
  ON public.about_contents
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_data IS NOT NULL);

CREATE POLICY "about_contents_admin_all"
  ON public.about_contents
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- skill_categories
CREATE POLICY "skill_categories_public_read_enabled"
  ON public.skill_categories
  FOR SELECT
  TO anon, authenticated
  USING (is_enabled = TRUE);

CREATE POLICY "skill_categories_admin_all"
  ON public.skill_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- skills
CREATE POLICY "skills_public_read_published"
  ON public.skills
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND is_enabled = TRUE);

CREATE POLICY "skills_admin_all"
  ON public.skills
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- media_assets
CREATE POLICY "media_assets_public_read_public_flagged"
  ON public.media_assets
  FOR SELECT
  TO anon, authenticated
  USING (is_public = TRUE);

CREATE POLICY "media_assets_admin_all"
  ON public.media_assets
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- resume_files
CREATE POLICY "resume_files_public_read_active_published"
  ON public.resume_files
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND is_active = TRUE);

CREATE POLICY "resume_files_admin_all"
  ON public.resume_files
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- projects
CREATE POLICY "projects_public_read_published"
  ON public.projects
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_data IS NOT NULL);

CREATE POLICY "projects_admin_all"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- project_technologies (readable publicly only when parent project is published)
CREATE POLICY "project_technologies_public_read_published_parent"
  ON public.project_technologies
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_technologies.project_id
        AND p.status = 'published'
    )
  );

CREATE POLICY "project_technologies_admin_all"
  ON public.project_technologies
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- project_sections (readable publicly only when enabled and parent project is published)
CREATE POLICY "project_sections_public_read_published_parent"
  ON public.project_sections
  FOR SELECT
  TO anon, authenticated
  USING (
    is_enabled = TRUE
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_sections.project_id
        AND p.status = 'published'
    )
  );

CREATE POLICY "project_sections_admin_all"
  ON public.project_sections
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- experiences
CREATE POLICY "experiences_public_read_published"
  ON public.experiences
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_data IS NOT NULL);

CREATE POLICY "experiences_admin_all"
  ON public.experiences
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- educations
CREATE POLICY "educations_public_read_published"
  ON public.educations
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_data IS NOT NULL);

CREATE POLICY "educations_admin_all"
  ON public.educations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- certifications
CREATE POLICY "certifications_public_read_published"
  ON public.certifications
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_data IS NOT NULL);

CREATE POLICY "certifications_admin_all"
  ON public.certifications
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- notes
CREATE POLICY "notes_public_read_published"
  ON public.notes
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_data IS NOT NULL);

CREATE POLICY "notes_admin_all"
  ON public.notes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- boot_greetings
CREATE POLICY "boot_greetings_public_read_published"
  ON public.boot_greetings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND is_enabled = TRUE);

CREATE POLICY "boot_greetings_admin_all"
  ON public.boot_greetings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. Supabase Storage Buckets & Access Policies
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('profile', 'profile', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('projects', 'projects', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('certificates', 'certificates', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('resume', 'resume', FALSE, 10485760, ARRAY['application/pdf']),
  ('articles', 'articles', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('og-images', 'og-images', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read access for public asset buckets (profile, projects, certificates, articles, og-images)
CREATE POLICY "storage_public_buckets_select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id IN ('profile', 'projects', 'certificates', 'articles', 'og-images')
  );

-- Resume bucket: public read only for objects referenced by an active published resume_files row
CREATE POLICY "storage_resume_published_only_select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'resume'
    AND EXISTS (
      SELECT 1
      FROM public.resume_files rf
      WHERE (rf.storage_path = storage.objects.name OR rf.storage_path = 'resume/' || storage.objects.name)
        AND rf.status = 'published'
        AND rf.is_active = TRUE
    )
  );

-- Admin full control across all 6 portfolio buckets
CREATE POLICY "storage_admin_all_operations"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id IN ('profile', 'projects', 'certificates', 'resume', 'articles', 'og-images')
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id IN ('profile', 'projects', 'certificates', 'resume', 'articles', 'og-images')
    AND public.is_admin()
  );
