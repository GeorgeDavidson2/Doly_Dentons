"use client";

import { Zap, FileText, Users, Star, ArrowRight, CheckCircle2, UserCheck } from "lucide-react";
import { getBadge } from "@/lib/reputation/badges";

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

interface Props {
  lawyer: LawyerDetail;
  events: ReputationEvent[];
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  matter_joined: Users,
  brief_generated: FileText,
  note_contributed: Star,
  note_upvoted: Star,
  handoff_completed: ArrowRight,
  match_accepted: UserCheck,
  profile_completed: CheckCircle2,
  cross_border_matter: Zap,
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function EventFeed({ lawyer, events }: Props) {
  const badge = getBadge(lawyer.reputation_score);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{lawyer.full_name}</p>
          <p className="text-xs text-gray-400">{lawyer.office_city}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-brand-purple">
            {lawyer.reputation_score.toLocaleString()}
          </p>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Events */}
      <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No reputation events yet</p>
        ) : (
          events.map((event) => {
            const Icon = EVENT_ICONS[event.event_type] ?? Zap;
            return (
              <div key={event.id} className="px-4 py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-brand-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug">{event.description}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{relativeTime(event.created_at)}</p>
                </div>
                <span className="text-xs font-semibold text-green-600 flex-shrink-0">
                  +{event.points}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
