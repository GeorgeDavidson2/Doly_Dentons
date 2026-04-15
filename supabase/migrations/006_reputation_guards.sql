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

-- ── award_upvote_points: defined and hardened in migration 007 ────────────────
-- Do not create the older SECURITY DEFINER version here: leaving this signature
-- in place can expose EXECUTE to PUBLIC by default and can also cause overloaded
-- RPC resolution issues once migration 007 introduces the canonical function.
DROP FUNCTION IF EXISTS award_upvote_points(UUID, UUID, TEXT, INT, INT);
