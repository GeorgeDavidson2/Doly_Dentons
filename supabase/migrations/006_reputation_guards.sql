-- Migration 006: Reputation guards
-- Partial unique index on reputation_events for profile_completed one-time guard.
-- awardPoints() uses Supabase's built-in aggregate for upvote SUM (no custom RPC needed).

-- ── Partial unique index: profile_completed is one-time per lawyer ────────────
-- Prevents double-award even under concurrent requests.
-- The INSERT in awardPoints() will receive a 23505 unique violation if already awarded.

CREATE UNIQUE INDEX IF NOT EXISTS reputation_events_profile_completed_once
  ON reputation_events (lawyer_id)
  WHERE event_type = 'profile_completed';
