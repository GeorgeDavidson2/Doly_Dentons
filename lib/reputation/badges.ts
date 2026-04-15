export const BADGE_TIERS = [
  { label: "Contributor", min: 0, color: "text-gray-500 bg-gray-100" },
  { label: "Rising Star", min: 100, color: "text-blue-600 bg-blue-50" },
  { label: "Regional Expert", min: 500, color: "text-brand-purple bg-brand-purple/10" },
  { label: "Global Expert", min: 1000, color: "text-orange-600 bg-orange-50" },
  { label: "Elite Partner", min: 2500, color: "text-yellow-700 bg-yellow-50" },
] as const;

export type BadgeTier = typeof BADGE_TIERS[number]["label"];

export function getBadge(score: number): (typeof BADGE_TIERS)[number] {
  return [...BADGE_TIERS].reverse().find((t) => score >= t.min) ?? BADGE_TIERS[0];
}
