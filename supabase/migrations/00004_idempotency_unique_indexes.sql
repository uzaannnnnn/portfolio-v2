-- ============================================================================
-- Migration: 00004_idempotency_unique_indexes.sql
-- Purpose: Safe, non-destructive unique indexes to guarantee database-level
-- idempotency for regional boot greetings and categorized skills.
-- ============================================================================

-- 1. Ensure regional boot greetings cannot have duplicate languages
CREATE UNIQUE INDEX IF NOT EXISTS idx_boot_greetings_language_unique
  ON public.boot_greetings (language);

-- 2. Ensure skills cannot have duplicate names within the same category
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_category_name_unique
  ON public.skills (category_id, name);

