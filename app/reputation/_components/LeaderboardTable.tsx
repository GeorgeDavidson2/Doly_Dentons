"use client";

import { getBadge } from "@/lib/reputation/badges";

interface LeaderboardEntry {
  id: string;
  full_name: string;
  office_city: string;
  office_country: string;
  reputation_score: number;
  avatar_url: string | null;
  matters_count: number;
  rank: number;
}

interface Props {
  leaderboard: LeaderboardEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  return <>{parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name[0]}</>;
}

const RANK_STYLES: Record<number, string> = {
  1: "text-yellow-600 font-bold",
  2: "text-gray-400 font-bold",
  3: "text-orange-500 font-bold",
};

export default function LeaderboardTable({ leaderboard, selectedId, onSelect }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-10">#</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Lawyer</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Badge</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Matters</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {leaderboard.map((entry) => {
            const badge = getBadge(entry.reputation_score);
            const isSelected = entry.id === selectedId;

            return (
              <tr
                key={entry.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => onSelect(entry.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(entry.id); } }}
                className={`cursor-pointer transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-purple ${
                  isSelected ? "bg-brand-purple/5 hover:bg-brand-purple/5" : ""
                }`}
              >
                {/* Rank */}
                <td className="px-4 py-3 text-sm">
                  <span className={RANK_STYLES[entry.rank] ?? "text-gray-400 font-medium"}>
                    {entry.rank}
                  </span>
                </td>

                {/* Avatar + name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-semibold text-brand-purple">
                        <Initials name={entry.full_name} />
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 leading-tight">{entry.full_name}</p>
                      <p className="text-xs text-gray-400">{entry.office_city}, {entry.office_country}</p>
                    </div>
                  </div>
                </td>

                {/* Badge */}
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                    {badge.label}
                  </span>
                </td>

                {/* Matters */}
                <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">
                  {entry.matters_count ?? 0}
                </td>

                {/* Score */}
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold ${isSelected ? "text-brand-purple" : "text-gray-900"}`}>
                    {entry.reputation_score.toLocaleString()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
