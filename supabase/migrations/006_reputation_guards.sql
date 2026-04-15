-- Migration 006: Reputation guards
-- Partial unique indexes for profile_completed (one-time per lawyer) and
-- brief_generated (one-time per lawyer+matter) idempotency.
-- Upvote caps are enforced via the custom RPC award_upvote_points (migration 007).

-- ── profile_completed: one-time per lawyer ────────────────────────────────────
WITH deleted_profile_completed AS (
  DELETE FROM reputation_events
  WHERE id NOT IN (
    SELECT DISTINCT ON (lawyer_id) id
    FROM reputation_events
    WHERE event_type = 'profile_completed'
    ORDER BY lawyer_id, created_at ASC
  )
  AND event_type = 'profile_completed'
  RETURNING lawyer_id, points
),
deleted_points_by_lawyer AS (
  SELECT lawyer_id, COALESCE(SUM(points), 0) AS deleted_points
  FROM deleted_profile_completed
  GROUP BY lawyer_id
)
UPDATE lawyers l
SET reputation_score = l.reputation_score - d.deleted_points
FROM deleted_points_by_lawyer d
WHERE l.id = d.lawyer_id;

CREATE UNIQUE INDEX IF NOT EXISTS reputation_events_profile_completed_once
  ON reputation_events (lawyer_id)
  WHERE event_type = 'profile_completed';

-- ── brief_generated: one-time per (lawyer, matter) ───────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS reputation_events_brief_generated_once
  ON reputation_events (lawyer_id, matter_id)
  WHERE event_type = 'brief_generated';

-- ── award_upvote_points: atomic cap-enforced upvote award ─────────────────────
-- Locks the lawyer row so concurrent upvotes cannot both read the same SUM
-- and both award past the cap. Insert + increment happen in one transaction.
-- Returns points actually awarded (0 if cap already reached).

CREATE OR REPLACE FUNCTION award_upvote_points(
  p_lawyer_id  UUID,
  p_matter_id  UUID    DEFAULT NULL,
  p_description TEXT   DEFAULT 'Field note upvoted',
  p_points     INT     DEFAULT 10,
  p_cap        INT     DEFAULT 200
)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total     INT;
  v_remaining INT;
  v_award     INT;
BEGIN
  -- Lock the lawyer row for the duration of this transaction to serialize
  -- concurrent upvote awards for the same lawyer.
  PERFORM id FROM lawyers WHERE id = p_lawyer_id FOR UPDATE;

  SELECT COALESCE(SUM(points), 0) INTO v_total
  FROM reputation_events
  WHERE lawyer_id = p_lawyer_id AND event_type = 'note_upvoted';

  v_remaining := p_cap - v_total;
  IF v_remaining <= 0 THEN
    RETURN 0;
  END IF;

  v_award := LEAST(p_points, v_remaining);

  INSERT INTO reputation_events (lawyer_id, event_type, points, matter_id, description)
  VALUES (p_lawyer_id, 'note_upvoted', v_award, p_matter_id, p_description);

  UPDATE lawyers
  SET reputation_score = reputation_score + v_award
  WHERE id = p_lawyer_id;

  RETURN v_award;
END;
$$;
