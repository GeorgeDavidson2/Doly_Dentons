import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { REPUTATION_POINTS, NOTE_UPVOTE_CAP, type ReputationEventType } from "./points";

// Re-export for back-compat with existing server-side imports.
export { REPUTATION_POINTS, NOTE_UPVOTE_CAP };
export type { ReputationEventType };

// ─── Badge tiers (re-exported from client-safe badges.ts) ───────────────────
export { BADGE_TIERS, getBadge } from "@/lib/reputation/badges";
export type { BadgeTier } from "@/lib/reputation/badges";

// ─── Core award function ──────────────────────────────────────────────────────

interface AwardOptions {
  lawyer_id: string;
  event_type: ReputationEventType;
  matter_id?: string | null;
  /** For note_upvoted: the field_note id — required to scope the per-note cap. */
  source_id?: string | null;
  description?: string;
}

/**
 * Awards reputation points to a lawyer.
 *
 * - note_upvoted: delegates entirely to award_upvote_points RPC, which locks
 *   the lawyer row and enforces the per-note cap atomically.
 * - All other events: delegates to award_reputation_event RPC, which inserts
 *   the event row and increments the score in one transaction.
 *   Events backed by a DB unique index (profile_completed: unique on lawyer_id;
 *   brief_generated: unique on (lawyer_id, matter_id)) will produce a 23505
 *   conflict on duplicate inserts, which is treated as a silent skip.
 *   Any event without a DB constraint must not rely on 23505 for idempotency.
 *
 * Returns points awarded, or null if skipped or failed.
 */
export async function awardPoints(opts: AwardOptions): Promise<number | null> {
  const { lawyer_id, event_type, matter_id, source_id, description } = opts;
  const points = REPUTATION_POINTS[event_type];
  const supabase = createServiceClient();

  // ── note_upvoted: atomic per-note cap via DB RPC ────────────────────────────
  if (event_type === "note_upvoted") {
    if (!source_id) {
      console.error("[reputation] note_upvoted requires source_id (field_note id)");
      return null;
    }

    const { data: awarded, error } = await supabase.rpc("award_upvote_points", {
      p_lawyer_id: lawyer_id,
      p_source_id: source_id,
      p_matter_id: matter_id ?? null,
      p_description: description ?? defaultDescription("note_upvoted"),
      p_points: points,
      p_cap: NOTE_UPVOTE_CAP,
    });

    if (error) {
      console.error("[reputation] award_upvote_points RPC failed:", error.message);
      return null;
    }

    return (awarded as number) > 0 ? (awarded as number) : null;
  }

  // ── All other events: atomic insert + increment via DB RPC ─────────────────
  const { error } = await supabase.rpc("award_reputation_event", {
    p_lawyer_id: lawyer_id,
    p_event_type: event_type,
    p_points: points,
    p_matter_id: matter_id ?? null,
    p_source_id: source_id ?? null,
    p_description: description ?? defaultDescription(event_type),
  });

  if (error) {
    // 23505 = unique violation — profile_completed or brief_generated already awarded
    if ((error as { code?: string }).code === "23505") return null;
    console.error(`[reputation] award_reputation_event RPC failed (${event_type}):`, error.message);
    return null;
  }

  return points;
}

function defaultDescription(event_type: ReputationEventType): string {
  switch (event_type) {
    case "matter_joined": return "Joined a matter team";
    case "brief_generated": return "Jurisdiction brief generated";
    case "note_contributed": return "Contributed a field note";
    case "note_upvoted": return "Field note upvoted";
    case "handoff_completed": return "Received a task handoff";
    case "match_accepted": return "Invited a lawyer to a matter";
    case "profile_completed": return "Completed profile (one-time bonus)";
    case "cross_border_matter": return "Led a cross-border matter";
  }
}
