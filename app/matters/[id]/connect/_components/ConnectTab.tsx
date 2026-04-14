"use client";

import { useState, useEffect } from "react";
import { Users, AlertCircle } from "lucide-react";
import LawyerMatchCard from "./LawyerMatchCard";
import type { EnrichedMatch } from "@/app/api/connect/match/route";

type Props = {
  matterId: string;
  teamLawyerIds: string[];
};

function MatchSkeleton() {
  return (
    <div className="bg-white border border-brand-grey rounded-xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-gray-100 rounded w-32" />
          <div className="h-2.5 bg-gray-100 rounded w-24" />
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 w-14 bg-gray-100 rounded-lg" />
        ))}
      </div>
      <div className="h-8 bg-gray-100 rounded-lg" />
    </div>
  );
}

export default function ConnectTab({ matterId, teamLawyerIds }: Props) {
  const [matches, setMatches] = useState<EnrichedMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch("/api/connect/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matter_id: matterId }),
        });
        const ct = res.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) {
          throw new Error("Unexpected server response");
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load matches");
        setMatches(data as EnrichedMatch[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    }
    void fetchMatches();
  }, [matterId]);

  const teamIds = new Set(teamLawyerIds);
  const jurisdictionCount = matches
    ? new Set(matches.flatMap((m) => m.matched_jurisdictions)).size
    : 0;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Lawyer Matching</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          AI-ranked lawyers by jurisdiction expertise, semantic fit, and reputation
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeletons */}
      {matches === null && !error && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <MatchSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {matches !== null && matches.length > 0 && (
        <>
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">{matches.length} lawyer{matches.length !== 1 ? "s" : ""}</span>
            {" matched across "}
            <span className="font-medium text-gray-700">{jurisdictionCount} jurisdiction{jurisdictionCount !== 1 ? "s" : ""}</span>
          </p>
          <div className="space-y-4">
            {matches.map((match) => (
              <LawyerMatchCard
                key={match.id}
                match={match}
                matterId={matterId}
                alreadyOnTeam={teamIds.has(match.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {matches !== null && matches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-8 h-8 text-brand-purple/40 mb-3" />
          <p className="text-sm font-medium text-gray-500">No matches found</p>
          <p className="text-xs text-gray-400 mt-1">
            Ensure lawyer profiles have jurisdiction data
          </p>
        </div>
      )}
    </div>
  );
}
