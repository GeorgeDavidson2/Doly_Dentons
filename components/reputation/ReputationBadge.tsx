const tiers = [
  { min: 1500, label: "Elite Partner",    classes: "bg-amber-50 text-amber-700 border-amber-300" },
  { min: 1000, label: "Global Expert",    classes: "bg-brand-purple/10 text-brand-purple border-brand-purple/30" },
  { min: 500,  label: "Regional Expert",  classes: "bg-blue-50 text-blue-600 border-blue-200" },
  { min: 200,  label: "Rising Star",      classes: "bg-green-50 text-green-600 border-green-200" },
  { min: 0,    label: "Contributor",      classes: "bg-gray-100 text-gray-500 border-gray-200" },
];

export function getTier(score: number) {
  return tiers.find((t) => score >= t.min) ?? tiers[tiers.length - 1];
}

export default function ReputationBadge({ score }: { score: number }) {
  const tier = getTier(score);
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${tier.classes}`}>
      {tier.label}
    </span>
  );
}
