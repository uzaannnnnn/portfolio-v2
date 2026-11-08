-- ============================================================================
-- Migration: 00003_transactional_publishing_rpc.sql
-- Purpose: Transactional Publishing and Unpublishing Stored Procedures (PostgreSQL RPC).
-- Guarantees atomic draft promotion, revision snapshot creation, publication event
-- logging, and audit trail recording in a single database transaction.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. public.publish_entity (ATOMIC PUBLISH RPC)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_entity(
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_revision_id UUID,
  p_version_number INTEGER,
  p_snapshot JSONB,
  p_change_summary TEXT DEFAULT '',
  p_actor_id UUID DEFAULT NULL,
  p_actor_email TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_updated_rows INTEGER := 0;
BEGIN
  -- Security check: caller must be a verified administrator
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only active administrators can publish content.'
      USING ERRCODE = '42501';
  END IF;

  -- 1. Append immutable content revision
  INSERT INTO public.content_revisions (
    id,
    entity_type,
    entity_id,
    version_number,
    state,
    snapshot,
    change_summary,
    created_by,
    created_at
  )
  VALUES (
    p_revision_id,
    p_entity_type,
    p_entity_id,
    p_version_number,
    'published',
    p_snapshot,
    COALESCE(p_change_summary, 'Published version ' || p_version_number),
    p_actor_id,
    v_now
  );

  -- 2. Atomically update target projection
  IF p_entity_type IN ('profile', 'site_settings', 'hero_content', 'about_content') THEN
    UPDATE public.singleton_configs
    SET
      status = 'published',
      published_data = p_snapshot,
      draft_data = p_snapshot,
      published_revision_id = p_revision_id,
      draft_revision_id = p_revision_id,
      published_at = v_now,
      updated_at = v_now
    WHERE key = p_entity_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  ELSIF p_entity_type = 'project' THEN
    UPDATE public.projects
    SET
      status = 'published',
      published_data = p_snapshot,
      draft_data = p_snapshot,
      published_revision_id = p_revision_id,
      draft_revision_id = p_revision_id,
      published_at = v_now,
      updated_at = v_now
    WHERE id::text = p_entity_id OR slug = p_entity_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  ELSIF p_entity_type = 'experience' THEN
    UPDATE public.experiences
    SET
      status = 'published',
      published_data = p_snapshot,
      draft_data = p_snapshot,
      published_revision_id = p_revision_id,
      updated_at = v_now
    WHERE id::text = p_entity_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  ELSIF p_entity_type = 'education' THEN
    UPDATE public.educations
    SET
      status = 'published',
      published_data = p_snapshot,
      draft_data = p_snapshot,
      published_revision_id = p_revision_id,
      updated_at = v_now
    WHERE id::text = p_entity_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  ELSIF p_entity_type = 'certification' THEN
    UPDATE public.certifications
    SET
      status = 'published',
      published_data = p_snapshot,
      draft_data = p_snapshot,
      published_revision_id = p_revision_id,
      updated_at = v_now
    WHERE id::text = p_entity_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  ELSIF p_entity_type = 'note' THEN
    UPDATE public.notes
    SET
      status = 'published',
      published_data = p_snapshot,
      draft_data = p_snapshot,
      published_revision_id = p_revision_id,
      published_at = v_now,
      updated_at = v_now
    WHERE id::text = p_entity_id OR slug = p_entity_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  ELSE
    RAISE EXCEPTION 'Unsupported publish entity type: %', p_entity_type
      USING ERRCODE = '22023';
  END IF;

  IF v_updated_rows = 0 THEN
    RAISE EXCEPTION 'Target entity not found: %/%', p_entity_type, p_entity_id
      USING ERRCODE = 'P0002';
  END IF;

  -- 3. Append publication record
  INSERT INTO public.content_publications (
    entity_type,
    entity_id,
    revision_id,
    action,
    published_by,
    published_at
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    p_revision_id,
    'publish',
    p_actor_id,
    v_now
  );

  -- 4. Append audit log
  INSERT INTO public.audit_logs (
    actor_id,
    actor_email,
    action,
    entity_type,
    entity_id,
    metadata,
    created_at
  )
  VALUES (
    p_actor_id,
    COALESCE(p_actor_email, 'admin'),
    'publish_content',
    p_entity_type,
    p_entity_id,
    jsonb_build_object(
      'revisionId', p_revision_id,
      'versionNumber', p_version_number
    ),
    v_now
  );

  RETURN jsonb_build_object(
    'ok', true,
    'entityType', p_entity_type,
    'entityId', p_entity_id,
    'revisionId', p_revision_id,
    'versionNumber', p_version_number,
    'publishedAt', v_now
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. public.unpublish_entity (ATOMIC UNPUBLISH / ARCHIVE RPC)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.unpublish_entity(
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_target_state TEXT DEFAULT 'draft',
  p_actor_id UUID DEFAULT NULL,
  p_actor_email TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_previous_revision_id UUID := NULL;
  v_updated_rows INTEGER := 0;
  v_action TEXT;
BEGIN
  -- Security check: caller must be a verified administrator
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only active administrators can unpublish content.'
      USING ERRCODE = '42501';
  END IF;

  IF p_target_state NOT IN ('draft', 'archived') THEN
    RAISE EXCEPTION 'Invalid target state: % (expected "draft" or "archived")', p_target_state
      USING ERRCODE = '22023';
  END IF;

  v_action := CASE WHEN p_target_state = 'archived' THEN 'archive' ELSE 'unpublish' END;

  -- Atomically isolate live projection
  IF p_entity_type IN ('profile', 'site_settings', 'hero_content', 'about_content') THEN
    SELECT published_revision_id INTO v_previous_revision_id
    FROM public.singleton_configs WHERE key = p_entity_id;

    UPDATE public.singleton_configs
    SET
      status = p_target_state,
      published_data = NULL,
      published_revision_id = NULL,
      updated_at = v_now
    WHERE key = p_entity_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  ELSIF p_entity_type = 'project' THEN
    SELECT published_revision_id INTO v_previous_revision_id
    FROM public.projects WHERE id::text = p_entity_id OR slug = p_entity_id;

    UPDATE public.projects
    SET
      status = p_target_state,
      published_data = NULL,
      published_revision_id = NULL,
      updated_at = v_now
    WHERE id::text = p_entity_id OR slug = p_entity_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  ELSIF p_entity_type = 'experience' THEN
    SELECT published_revision_id INTO v_previous_revision_id
    FROM public.experiences WHERE id::text = p_entity_id;

    UPDATE public.experiences
    SET
      status = p_target_state,
      published_data = NULL,
      published_revision_id = NULL,
      updated_at = v_now
    WHERE id::text = p_entity_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  ELSIF p_entity_type = 'education' THEN
    SELECT published_revision_id INTO v_previous_revision_id
    FROM public.educations WHERE id::text = p_entity_id;

    UPDATE public.educations
    SET
      status = p_target_state,
      published_data = NULL,
      published_revision_id = NULL,
      updated_at = v_now
    WHERE id::text = p_entity_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  ELSIF p_entity_type = 'certification' THEN
    SELECT published_revision_id INTO v_previous_revision_id
    FROM public.certifications WHERE id::text = p_entity_id;

    UPDATE public.certifications
    SET
      status = p_target_state,
      published_data = NULL,
      published_revision_id = NULL,
      updated_at = v_now
    WHERE id::text = p_entity_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  ELSIF p_entity_type = 'note' THEN
    SELECT published_revision_id INTO v_previous_revision_id
    FROM public.notes WHERE id::text = p_entity_id OR slug = p_entity_id;

    UPDATE public.notes
    SET
      status = p_target_state,
      published_data = NULL,
      published_revision_id = NULL,
      updated_at = v_now
    WHERE id::text = p_entity_id OR slug = p_entity_id;
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  ELSE
    RAISE EXCEPTION 'Unsupported unpublish entity type: %', p_entity_type
      USING ERRCODE = '22023';
  END IF;

  IF v_updated_rows = 0 THEN
    RAISE EXCEPTION 'Target entity not found: %/%', p_entity_type, p_entity_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Append publication event
  INSERT INTO public.content_publications (
    entity_type,
    entity_id,
    revision_id,
    action,
    published_by,
    published_at
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    v_previous_revision_id,
    v_action,
    p_actor_id,
    v_now
  );

  -- Append audit log
  INSERT INTO public.audit_logs (
    actor_id,
    actor_email,
    action,
    entity_type,
    entity_id,
    metadata,
    created_at
  )
  VALUES (
    p_actor_id,
    COALESCE(p_actor_email, 'admin'),
    v_action || '_content',
    p_entity_type,
    p_entity_id,
    jsonb_build_object(
      'targetState', p_target_state,
      'previousRevisionId', v_previous_revision_id
    ),
    v_now
  );

  RETURN jsonb_build_object(
    'ok', true,
    'entityType', p_entity_type,
    'entityId', p_entity_id,
    'targetState', p_target_state,
    'unpublishAt', v_now
  );
END;
$$;

-- Revoke all direct permissions from public and grant to authenticated and service_role
REVOKE ALL ON FUNCTION public.publish_entity FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_entity TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.unpublish_entity FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unpublish_entity TO authenticated, service_role;

