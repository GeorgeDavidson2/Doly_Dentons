"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { JURISDICTIONS } from "@/lib/jurisdictions";
import type { EnrichedMatch } from "@/app/api/connect/match/route";

function getFlag(code: string): string {
  return JURISDICTIONS.find((j) => j.code === code)?.flag ?? "";
}

function getReputationTier(score: number): string {
  if (score >= 2500) return "Elite";
  if (score >= 2000) return "Master";
  if (score >= 1500) return "Expert";
  if (score >= 1000) return "Senior";
  if (score >= 500) return "Practitioner";
  if (score >= 250) return "Associate";
  return "Emerging";
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : "bg-gray-300";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-xs font-semibold tabular-nums ${
          pct >= 80
            ? "text-green-600"
            : pct >= 60
            ? "text-amber-600"
            : "text-gray-400"
        }`}
      >
        {pct}%
      </span>
    </div>
  );
}

function ExpertiseStars({ level }: { level: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`Expertise level ${level} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-2.5 h-2.5 ${
            i < level ? "fill-brand-purple text-brand-purple" : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return <>?</>;
  return (
    <>
      {parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`
        : parts[0][0]}
    </>
  );
}

type Props = {
  match: EnrichedMatch;
  matterId: string;
  alreadyOnTeam: boolean;
};

export default function LawyerMatchCard({ match, matterId, alreadyOnTeam }: Props) {
  const [invited, setInvited] = useState(alreadyOnTeam);
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function handleInvite() {
    setInviting(true);
    try {
      const res = await fetch(`/api/matters/${matterId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lawyer_id: match.id,
          role: "collaborator",
          match_score: match.score,
        }),
      });
      if (res.ok) {
        setInvited(true);
        setToast("+20 reputation points");
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setInviting(false);
    }
  }

  const tier = getReputationTier(match.reputation_score);

  return (
    <div className="relative bg-white border border-brand-grey rounded-xl p-5 space-y-4">
      {/* Toast */}
      {toast && (
        <div className="absolute top-3 right-3 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-brand-purple/10 text-brand-purple text-sm font-semibold flex items-center justify-center flex-shrink-0">
            <Initials name={match.full_name} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{match.full_name}</p>
            <p className="text-xs text-gray-500">
              {match.title} · {match.office_city}
            </p>
          </div>
        </div>

        {/* Reputation tier badge */}
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-brand-purple/5 text-brand-purple border-brand-purple/20 flex-shrink-0">
          {tier}
        </span>
      </div>

      {/* Match score */}
      <div>
        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">
          Match score
        </p>
        <ScoreBar score={match.score} />
      </div>

      {/* Matched jurisdictions */}
      <div>
        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-2">
          Jurisdictions
        </p>
        <div className="flex flex-wrap gap-2">
          {match.matched_jurisdictions.map((code) => {
            const level = match.expertise_levels[code] ?? 0;
            return (
              <div
                key={code}
                className="flex flex-col items-center gap-1 bg-gray-50 border border-brand-grey rounded-lg px-2.5 py-1.5"
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm" aria-hidden="true">
                    {getFlag(code)}
                  </span>
                  <span className="text-xs font-semibold text-gray-700">{code}</span>
                </div>
                <ExpertiseStars level={level} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite button */}
      <button
        type="button"
        onClick={() => void handleInvite()}
        disabled={invited || inviting}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors
          disabled:cursor-not-allowed
          bg-brand-purple text-white hover:bg-brand-purple-dark
          disabled:bg-gray-100 disabled:text-gray-400"
      >
        {invited ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Invited
          </>
        ) : inviting ? (
          "Inviting…"
        ) : (
          "Invite to Matter"
        )}
      </button>
    </div>
  );
}
