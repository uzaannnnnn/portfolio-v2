-- =============================================================================
-- Migration 00006: IP-Based Daily Deduplicated Visitor Counter
-- Structure:
-- 1. public.visitor_counters (Aggregate total counter)
-- 2. public.visitor_daily_fingerprints (Keyed daily HMAC fingerprints)
-- 3. public.record_portfolio_visit(p_fingerprint, p_visit_date) (Atomic RPC)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.visitor_counters (
  id TEXT PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Initialize default counter record
INSERT INTO public.visitor_counters (id, count, updated_at)
VALUES ('homepage_hero', 0, NOW())
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.visitor_daily_fingerprints (
  fingerprint_hash TEXT PRIMARY KEY,
  visit_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_fingerprints_date
  ON public.visitor_daily_fingerprints (visit_date);

-- Enable RLS
ALTER TABLE public.visitor_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_daily_fingerprints ENABLE ROW LEVEL SECURITY;

-- Public can read aggregate count only
DROP POLICY IF EXISTS "Public can read visitor counter aggregate" ON public.visitor_counters;
CREATE POLICY "Public can read visitor counter aggregate"
  ON public.visitor_counters
  FOR SELECT
  TO anon, authenticated
  USING (id = 'homepage_hero');

-- Public users NEVER have direct access to visitor_daily_fingerprints
-- Fingerprints are strictly accessible via SECURITY DEFINER function

-- Atomic increment RPC function
CREATE OR REPLACE FUNCTION public.record_portfolio_visit(
  p_fingerprint TEXT,
  p_visit_date DATE
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted BOOLEAN := FALSE;
  v_current_count BIGINT := 0;
BEGIN
  -- 1. Attempt to insert daily fingerprint
  INSERT INTO public.visitor_daily_fingerprints (fingerprint_hash, visit_date, created_at)
  VALUES (p_fingerprint, p_visit_date, NOW())
  ON CONFLICT (fingerprint_hash) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- 2. If newly inserted today, atomically increment the counter
  IF v_inserted > 0 THEN
    UPDATE public.visitor_counters
    SET count = count + 1, updated_at = NOW()
    WHERE id = 'homepage_hero'
    RETURNING count INTO v_current_count;
  ELSE
    -- Already counted today, return existing aggregate
    SELECT count INTO v_current_count
    FROM public.visitor_counters
    WHERE id = 'homepage_hero';
  END IF;

  RETURN COALESCE(v_current_count, 0);
END;
$$;

-- Grant execute on RPC function to anon and authenticated
GRANT EXECUTE ON FUNCTION public.record_portfolio_visit(TEXT, DATE) TO anon, authenticated;

