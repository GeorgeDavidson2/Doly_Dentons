-- Migration 007: Atomic reputation awards + per-note upvote cap + source_id

-- ── Add source_id to reputation_events ───────────────────────────────────────
-- Scopes upvote events to a specific field_note (or any source entity).
ALTER TABLE reputation_events
  ADD COLUMN IF NOT EXISTS source_id UUID DEFAULT NULL;

-- ── award_reputation_event: atomic insert + increment in one transaction ──────
-- Replaces the two-step insert + increment_reputation_rpc pattern.
-- profile_completed and brief_generated callers rely on their unique indexes
-- to get 23505 on duplicate — this function does not handle ON CONFLICT itself.

CREATE OR REPLACE FUNCTION award_reputation_event(
  p_lawyer_id   UUID,
  p_event_type  TEXT,
  p_points      INT,
  p_matter_id   UUID    DEFAULT NULL,
  p_source_id   UUID    DEFAULT NULL,
  p_description TEXT    DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO reputation_events (lawyer_id, event_type, points, matter_id, source_id, description)
  VALUES (p_lawyer_id, p_event_type, p_points, p_matter_id, p_source_id, p_description);

  UPDATE lawyers
  SET reputation_score = reputation_score + p_points
  WHERE id = p_lawyer_id;
END;
$$;

-- ── award_upvote_points: per-note cap, fully atomic ───────────────────────────
-- Locks the lawyer row to serialize concurrent upvotes for the same lawyer.
-- Cap of 200 pts is scoped to (lawyer_id, source_id) — i.e. per field note.
-- Returns points actually awarded (0 if cap already reached for this note).

CREATE OR REPLACE FUNCTION award_upvote_points(
  p_lawyer_id   UUID,
  p_source_id   UUID,
  p_matter_id   UUID    DEFAULT NULL,
  p_description TEXT    DEFAULT 'Field note upvoted',
  p_points      INT     DEFAULT 10,
  p_cap         INT     DEFAULT 200
)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total     INT;
  v_remaining INT;
  v_award     INT;
BEGIN
  -- Serialize concurrent upvote awards for the same lawyer
  PERFORM id FROM lawyers WHERE id = p_lawyer_id FOR UPDATE;

  -- Sum points already awarded for this specific note
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
  VALUES (p_lawyer_id, 'note_upvoted', v_award, p_matter_id, p_source_id, p_description);

  UPDATE lawyers
  SET reputation_score = reputation_score + v_award
  WHERE id = p_lawyer_id;

  RETURN v_award;
END;
$$;
