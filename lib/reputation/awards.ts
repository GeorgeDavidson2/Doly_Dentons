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

// Cap on total points earned from note_upvoted events
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
  description?: string;
}

/**
 * Awards reputation points to a lawyer.
 * Inserts a reputation_events row and increments lawyers.reputation_score.
 * Returns the new reputation score, or null on failure.
 */
export async function awardPoints(opts: AwardOptions): Promise<number | null> {
  const { lawyer_id, event_type, matter_id, description } = opts;
  const points = REPUTATION_POINTS[event_type];

  const supabase = createServiceClient();

  // For note_upvoted: check running total against cap before awarding
  if (event_type === "note_upvoted") {
    const { data: upvoteSum } = await supabase
      .from("reputation_events")
      .select("points")
      .eq("lawyer_id", lawyer_id)
      .eq("event_type", "note_upvoted");

    const total = (upvoteSum ?? []).reduce((sum, r) => sum + r.points, 0);
    if (total >= NOTE_UPVOTE_CAP) return null;
  }

  // For profile_completed: one-time only
  if (event_type === "profile_completed") {
    const { data: existing } = await supabase
      .from("reputation_events")
      .select("id")
      .eq("lawyer_id", lawyer_id)
      .eq("event_type", "profile_completed")
      .maybeSingle();

    if (existing) return null;
  }

  // Insert event
  const { error: eventError } = await supabase.from("reputation_events").insert({
    lawyer_id,
    event_type,
    points,
    matter_id: matter_id ?? null,
    description: description ?? defaultDescription(event_type),
  });

  if (eventError) {
    console.error(`[reputation] Failed to insert event ${event_type}:`, eventError.message);
    return null;
  }

  // Increment score on lawyers table
  const { data: lawyer, error: fetchError } = await supabase
    .from("lawyers")
    .select("reputation_score")
    .eq("id", lawyer_id)
    .single();

  if (fetchError || !lawyer) {
    console.error(`[reputation] Failed to fetch lawyer ${lawyer_id}:`, fetchError?.message);
    return null;
  }

  const newScore = (lawyer.reputation_score ?? 0) + points;

  const { error: updateError } = await supabase
    .from("lawyers")
    .update({ reputation_score: newScore })
    .eq("id", lawyer_id);

  if (updateError) {
    console.error(`[reputation] Failed to update score for ${lawyer_id}:`, updateError.message);
    return null;
  }

  return newScore;
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
