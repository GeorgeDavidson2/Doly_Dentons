"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import LeaderboardTable from "./_components/LeaderboardTable";
import EventFeed from "./_components/EventFeed";
import ReputationChart from "./_components/ReputationChart";
import type { Lawyer, ReputationEvent } from "@/types";

// Shape returned by GET /api/reputation (leaderboard entry)
type LeaderboardEntry = Pick<
  Lawyer,
  "id" | "full_name" | "office_city" | "office_country" | "reputation_score" | "avatar_url" | "matters_count"
> & { rank: number };

// Shape returned by GET /api/reputation?lawyer_id=xxx
type LawyerDetail = Pick<Lawyer, "id" | "full_name" | "office_city" | "reputation_score" | "avatar_url">;

export default function ReputationPage() {
  const router = useRouter();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [boardError, setBoardError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLawyer, setSelectedLawyer] = useState<LawyerDetail | null>(null);
  const [events, setEvents] = useState<ReputationEvent[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Track latest request to discard stale responses from rapid row clicks
  const latestRequestId = useRef(0);

  // Fetch leaderboard on mount
  useEffect(() => {
    fetch("/api/reputation")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        if (!r.ok) throw new Error(`Failed to load leaderboard (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setLeaderboard(data.leaderboard ?? []);
        if (data.leaderboard?.length) setSelectedId(data.leaderboard[0].id);
      })
      .catch((err) => setBoardError(err.message))
      .finally(() => setLoadingBoard(false));
  }, [router]);

  // Fetch detail when selection changes — request ID guard prevents stale responses from updating state
  const fetchDetail = useCallback(async (lawyerId: string) => {
    const requestId = ++latestRequestId.current;

    // Clear stale state immediately on selection change
    setSelectedLawyer(null);
    setEvents([]);
    setLoadingDetail(true);

    try {
      const res = await fetch(`/api/reputation?lawyer_id=${lawyerId}`);
      if (requestId !== latestRequestId.current) return; // superseded

      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) return;

      const data = await res.json();
      if (requestId !== latestRequestId.current) return; // superseded

      setSelectedLawyer(data.lawyer);
      setEvents(data.events ?? []);
    } finally {
      if (requestId === latestRequestId.current) setLoadingDetail(false);
    }
  }, [router]);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reputation</h1>
        <p className="text-sm text-gray-500 mt-1">
          Firm-wide leaderboard — earned through cross-border collaboration
        </p>
      </div>

      {loadingBoard ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
        </div>
      ) : boardError ? (
        <div className="text-center py-16 text-sm text-red-500">{boardError}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard — takes 2 of 3 columns */}
          <div className="lg:col-span-2">
            <LeaderboardTable
              leaderboard={leaderboard}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          {/* Detail panel */}
          <div className="space-y-4">
            {loadingDetail ? (
              <div className="bg-white border border-gray-200 rounded-xl flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-brand-purple" />
              </div>
            ) : selectedLawyer ? (
              <>
                <ReputationChart
                  events={events}
                  currentScore={selectedLawyer.reputation_score}
                />
                <EventFeed lawyer={selectedLawyer} events={events} />
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
