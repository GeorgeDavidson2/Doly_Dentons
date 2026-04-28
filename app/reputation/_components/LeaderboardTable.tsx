"use client";

import { useState } from "react";
import { Search } from "lucide-react";
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
  currentLawyerId: string | null;
  selfEntry: LeaderboardEntry | null;
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

function LawyerRow({
  entry,
  isSelected,
  isYou,
  onSelect,
}: {
  entry: LeaderboardEntry;
  isSelected: boolean;
  isYou: boolean;
  onSelect: (id: string) => void;
}) {
  const badge = getBadge(entry.reputation_score);
  return (
    <tr
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect(entry.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(entry.id); } }}
      className={`cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-purple ${
        isYou
          ? "bg-brand-purple/5 border-l-2 border-brand-purple hover:bg-brand-purple/10"
          : isSelected
          ? "bg-brand-purple/5 hover:bg-brand-purple/5"
          : "hover:bg-gray-50"
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
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 leading-tight">{entry.full_name}</p>
              {isYou && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-purple text-white leading-none">
                  You
                </span>
              )}
            </div>
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
        <span className={`font-semibold ${isSelected || isYou ? "text-brand-purple" : "text-gray-900"}`}>
          {entry.reputation_score.toLocaleString()}
        </span>
      </td>
    </tr>
  );
}

export default function LeaderboardTable({ leaderboard, selectedId, onSelect, currentLawyerId, selfEntry }: Props) {
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filtered = query
    ? leaderboard.filter((e) => e.full_name.toLowerCase().includes(query))
    : leaderboard;

  // Pin self-row only when the user is outside the currently visible (filtered) list
  const selfInFiltered = currentLawyerId ? filtered.some((e) => e.id === currentLawyerId) : false;
  const selfMatchesSearch = selfEntry && (!query || selfEntry.full_name.toLowerCase().includes(query));
  const showPinnedSelf = selfEntry && selfMatchesSearch && !selfInFiltered;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search by name"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
          />
        </div>
      </div>

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
          {filtered.length === 0 && !showPinnedSelf ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                No results for &ldquo;{search}&rdquo;
              </td>
            </tr>
          ) : (
            filtered.map((entry) => (
              <LawyerRow
                key={entry.id}
                entry={entry}
                isSelected={entry.id === selectedId}
                isYou={entry.id === currentLawyerId}
                onSelect={onSelect}
              />
            ))
          )}
        </tbody>
      </table>

      {/* Pinned self-row — shown when user is ranked outside the visible list */}
      {showPinnedSelf && (
        <>
          <div className="border-t-2 border-dashed border-brand-purple/30" />
          <table className="w-full text-sm">
            <tbody>
              <LawyerRow
                entry={selfEntry!}
                isSelected={selfEntry!.id === selectedId}
                isYou
                onSelect={onSelect}
              />
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
