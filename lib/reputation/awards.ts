import { createServiceClient } from "@/lib/supabase/server";

// ─── Point values ────────────────────────────────────────────────────────────

export const REPUTATION_POINTS = {
  matter_joined: 30,
  brief_generated: 50,
  note_contributed: 40,
  note_upvoted: 10,
  handoff_completed: 25,
  match_accepted: 20,
  profile_completed: 60,
  cross_border_matter: 100,
} as const;

export type ReputationEventType = keyof typeof REPUTATION_POINTS;

// Max points a single field note can earn its author from upvotes
export const NOTE_UPVOTE_CAP = 200;

// ─── Badge tiers ─────────────────────────────────────────────────────────────

export const BADGE_TIERS = [
  { label: "Contributor", min: 0 },
  { label: "Rising Star", min: 100 },
  { label: "Regional Expert", min: 500 },
  { label: "Global Expert", min: 1000 },
  { label: "Elite Partner", min: 2500 },
] as const;

export type BadgeTier = typeof BADGE_TIERS[number]["label"];

export function getBadge(score: number): BadgeTier {
  const tier = [...BADGE_TIERS].reverse().find((t) => score >= t.min);
  return tier?.label ?? "Contributor";
}

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
 *   profile_completed and brief_generated have DB unique indexes; a 23505
 *   conflict means already awarded and is treated as a silent skip.
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
