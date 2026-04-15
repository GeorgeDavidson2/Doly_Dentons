"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import LeaderboardTable from "./_components/LeaderboardTable";
import EventFeed from "./_components/EventFeed";
import ReputationChart from "./_components/ReputationChart";

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

interface ReputationEvent {
  id: string;
  event_type: string;
  points: number;
  description: string;
  matter_id: string | null;
  created_at: string;
}

interface LawyerDetail {
  id: string;
  full_name: string;
  office_city: string;
  reputation_score: number;
  avatar_url: string | null;
}

export default function ReputationPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLawyer, setSelectedLawyer] = useState<LawyerDetail | null>(null);
  const [events, setEvents] = useState<ReputationEvent[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch leaderboard on mount
  useEffect(() => {
    fetch("/api/reputation")
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard ?? []);
        // Auto-select #1 on load
        if (data.leaderboard?.length) {
          setSelectedId(data.leaderboard[0].id);
        }
      })
      .finally(() => setLoadingBoard(false));
  }, []);

  // Fetch detail when selection changes
  const fetchDetail = useCallback(async (lawyerId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/reputation?lawyer_id=${lawyerId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSelectedLawyer(data.lawyer);
      setEvents(data.events ?? []);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

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
