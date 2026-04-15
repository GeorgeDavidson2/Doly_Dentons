-- Migration 007: Atomic reputation awards + per-note upvote cap + source_id

-- ── Add source_id to reputation_events ───────────────────────────────────────
ALTER TABLE reputation_events
  ADD COLUMN IF NOT EXISTS source_id UUID DEFAULT NULL;

-- ── Index for award_upvote_points SUM query ───────────────────────────────────
-- The upvote cap check filters on (lawyer_id, event_type, source_id).
CREATE INDEX IF NOT EXISTS reputation_events_upvote_sum_idx
  ON reputation_events (lawyer_id, source_id)
  WHERE event_type = 'note_upvoted';

-- ── award_reputation_event ────────────────────────────────────────────────────
-- Inserts a reputation_events row and increments lawyers.reputation_score in
-- one transaction. COALESCE(p_description, '') guards the NOT NULL constraint.
-- search_path is fixed to prevent schema hijacking.

CREATE OR REPLACE FUNCTION award_reputation_event(
  p_lawyer_id   UUID,
  p_event_type  TEXT,
  p_points      INT,
  p_matter_id   UUID    DEFAULT NULL,
  p_source_id   UUID    DEFAULT NULL,
  p_description TEXT    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO reputation_events (lawyer_id, event_type, points, matter_id, source_id, description)
  VALUES (
    p_lawyer_id,
    p_event_type,
    p_points,
    p_matter_id,
    p_source_id,
    COALESCE(p_description, '')
  );

  UPDATE lawyers
  SET reputation_score = reputation_score + p_points
  WHERE id = p_lawyer_id;
END;
$$;

-- Lock down: only the service role may call this function.
REVOKE ALL ON FUNCTION award_reputation_event(UUID, TEXT, INT, UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION award_reputation_event(UUID, TEXT, INT, UUID, UUID, TEXT) TO service_role;

-- ── award_upvote_points ───────────────────────────────────────────────────────
-- Drop the old signature from migration 006 (no p_source_id) so we don't
-- accumulate overloads — PostgREST does not handle overloaded RPCs reliably.
DROP FUNCTION IF EXISTS award_upvote_points(UUID, UUID, TEXT, INT, INT);

-- Locks the lawyer row to serialize concurrent upvotes.
-- Cap is scoped to (lawyer_id, source_id) — per field note.
-- Returns points actually awarded (0 if cap already reached).
-- search_path is fixed to prevent schema hijacking.

CREATE OR REPLACE FUNCTION award_upvote_points(
  p_lawyer_id   UUID,
  p_source_id   UUID,
  p_matter_id   UUID    DEFAULT NULL,
  p_description TEXT    DEFAULT 'Field note upvoted',
  p_points      INT     DEFAULT 10,
  p_cap         INT     DEFAULT 200
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total     INT;
  v_remaining INT;
  v_award     INT;
BEGIN
  PERFORM id FROM lawyers WHERE id = p_lawyer_id FOR UPDATE;

  SELECT COALESCE(SUM(points), 0) INTO v_total
  FROM reputation_events
  WHERE lawyer_id = p_lawyer_id
    AND event_type = 'note_upvoted'
    AND source_id  = p_source_id;

  v_remaining := p_cap - v_total;
  IF v_remaining <= 0 THEN
    RETURN 0;
  END IF;

  v_award := LEAST(p_points, v_remaining);

  INSERT INTO reputation_events (lawyer_id, event_type, points, matter_id, source_id, description)
  VALUES (
    p_lawyer_id,
    'note_upvoted',
    v_award,
    p_matter_id,
    p_source_id,
    COALESCE(p_description, 'Field note upvoted')
  );

  UPDATE lawyers
  SET reputation_score = reputation_score + v_award
  WHERE id = p_lawyer_id;

  RETURN v_award;
END;
$$;

-- Lock down: only the service role may call this function.
REVOKE ALL ON FUNCTION award_upvote_points(UUID, UUID, UUID, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION award_upvote_points(UUID, UUID, UUID, TEXT, INT, INT) TO service_role;
