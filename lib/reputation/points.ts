// Client-safe point values. Imported by both server-only `awards.ts` and
// any client component that needs to display the reward amount in the UI.
// Keep this file free of `server-only` and DB imports.

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
