-- ============================================================================
-- Migration: 00007_deprecate_skills_and_notes.sql
-- Description: Deprecation & Schema Simplification for Skills, Engineering Notes,
--              and Standalone Media Management.
--
-- Safety Guarantees:
-- 1. Does not truncate or destroy existing records in public.skills,
--    public.skill_categories, public.notes, or public.media_assets.
-- 2. Preserves foreign key relationships (e.g. cover_media_id, certificate_media_id).
-- 3. Keeps Supabase Storage buckets ('profile', 'projects', 'certificates', 'resume')
--    fully operational for inline direct file uploads.
-- ============================================================================

-- Add deprecation notice metadata comments to relevant tables
COMMENT ON TABLE public.skill_categories IS 'DEPRECATED: Skills CMS module removed in favor of direct project showcase case studies.';
COMMENT ON TABLE public.skills IS 'DEPRECATED: Technical skill percentage/proficiency bars removed from portfolio.';
COMMENT ON TABLE public.notes IS 'DEPRECATED: Engineering Notes CMS module removed to focus exclusively on project case studies.';
COMMENT ON TABLE public.media_assets IS 'LEGACY/INLINE: Retained for metadata tracking of inline uploads; standalone media library removed.';

-- Ensure storage buckets for inline upload remain verified and accessible
DO $$
BEGIN
  -- Verify inline target buckets exist and have proper size limits
  UPDATE storage.buckets
  SET file_size_limit = 5242880
  WHERE id = 'profile';

  UPDATE storage.buckets
  SET file_size_limit = 10485760
  WHERE id IN ('projects', 'certificates', 'resume');
END $$;

