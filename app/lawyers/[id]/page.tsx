import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Globe, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import JurisdictionMatrix from "@/components/lawyers/JurisdictionMatrix";
import ReputationBadge from "@/components/reputation/ReputationBadge";
import type { Lawyer, LawyerJurisdiction, ReputationEvent } from "@/types";

const eventLabels: Record<ReputationEvent["event_type"], string> = {
  matter_joined:      "Joined a matter",
  brief_generated:    "Generated jurisdiction brief",
  note_contributed:   "Contributed a field note",
  note_upvoted:       "Field note upvoted",
  handoff_completed:  "Completed task handoff",
  match_accepted:     "Accepted as expert match",
  profile_completed:  "Completed profile",
  cross_border_matter:"Led cross-border matter",
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : name[0];
}

export default async function LawyerProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [lawyerResult, jurisdictionsResult, eventsResult] = await Promise.all([
    supabase
      .from("lawyers")
      .select("id, full_name, title, office_city, office_country, timezone, languages, bio, avatar_url, reputation_score, matters_count, contributions")
      .eq("id", params.id)
      .single(),
    supabase
      .from("lawyer_jurisdictions")
      .select("id, jurisdiction_code, jurisdiction_name, expertise_level, matter_types, years_experience")
      .eq("lawyer_id", params.id)
      .order("expertise_level", { ascending: false }),
    supabase
      .from("reputation_events")
      .select("id, event_type, points, description, created_at")
      .eq("lawyer_id", params.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (lawyerResult.error || !lawyerResult.data) notFound();

  if (jurisdictionsResult.error) {
    throw new Error(`Failed to load jurisdictions: ${jurisdictionsResult.error.message}`);
  }

  if (eventsResult.error) {
    throw new Error(`Failed to load reputation events: ${eventsResult.error.message}`);
  }

  const lawyer = lawyerResult.data as Lawyer;
  const jurisdictions = jurisdictionsResult.data as LawyerJurisdiction[];
  const events = eventsResult.data as ReputationEvent[];

  return (
    <main className="flex-1 p-8 max-w-4xl">
      {/* Back */}
      <Link
        href="/lawyers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to directory
      </Link>

      {/* Hero */}
      <div className="bg-white border border-brand-grey rounded-xl p-6 mb-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
            {lawyer.avatar_url ? (
              <Image
                src={lawyer.avatar_url}
                alt={lawyer.full_name}
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="text-brand-purple font-bold text-xl">
                <Initials name={lawyer.full_name} />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{lawyer.full_name}</h1>
                <p className="text-gray-500 text-sm mt-0.5">{lawyer.title}</p>
              </div>
              <ReputationBadge score={lawyer.reputation_score} />
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {lawyer.office_city}, {lawyer.office_country}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                {lawyer.languages.join(", ")}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                {lawyer.matters_count} cross-border matters
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {lawyer.bio && (
        <div className="bg-white border border-brand-grey rounded-xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">About</h2>
          <p className="text-gray-700 text-sm leading-relaxed">{lawyer.bio}</p>
        </div>
      )}

      {/* Jurisdiction Matrix */}
      <div className="bg-white border border-brand-grey rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Jurisdiction Expertise
          </h2>
          <span className="text-xs text-gray-400">{jurisdictions.length} jurisdictions</span>
        </div>
        <JurisdictionMatrix jurisdictions={jurisdictions} />
      </div>

      {/* Reputation */}
      <div className="bg-white border border-brand-grey rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Reputation
          </h2>
          <span className="text-2xl font-bold text-gray-900">
            {lawyer.reputation_score.toLocaleString()}
            <span className="text-sm font-normal text-gray-400 ml-1">pts</span>
          </span>
        </div>

        {events.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {events.map((event) => (
              <li key={event.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-gray-700">{eventLabels[event.event_type]}</p>
                  {event.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{event.description}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-green-600 flex-shrink-0 ml-4">
                  +{event.points}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No recent activity.</p>
        )}
      </div>
    </main>
  );
}
