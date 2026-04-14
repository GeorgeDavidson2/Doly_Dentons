import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getMatterDetail, type MatterDetail } from "../_lib/getMatter";

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  return (
    <>
      {parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`
        : name[0]}
    </>
  );
}

const ROLE_STYLES: Record<string, string> = {
  lead: "bg-brand-purple/10 text-brand-purple border-brand-purple/20",
  collaborator: "bg-blue-50 text-blue-700 border-blue-200",
  reviewer: "bg-gray-100 text-gray-500 border-gray-200",
};

type TeamMember = MatterDetail["matter_team"][number];

function TeamMemberCard({ member }: { member: TeamMember }) {
  const lawyer = member.lawyer;
  if (!lawyer) return null;

  return (
    <Link
      href={`/lawyers/${lawyer.id}`}
      className="flex items-center gap-3 p-4 bg-white border border-brand-grey rounded-xl hover:border-brand-purple hover:shadow-sm transition-all group"
    >
      <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
        {lawyer.avatar_url ? (
          <Image
            src={lawyer.avatar_url}
            alt={lawyer.full_name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <span className="text-brand-purple font-semibold text-sm">
            <Initials name={lawyer.full_name} />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-purple transition-colors truncate">
          {lawyer.full_name}
        </p>
        <p className="text-xs text-gray-500 truncate">{lawyer.title}</p>
        <p className="text-xs text-gray-400">
          {lawyer.office_city}, {lawyer.office_country}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
            ROLE_STYLES[member.role] ?? ROLE_STYLES.collaborator
          }`}
        >
          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
        </span>
        <span className="text-[11px] text-gray-400">
          {lawyer.reputation_score.toLocaleString()} pts
        </span>
      </div>
    </Link>
  );
}

export default async function MatterOverviewPage({
  params,
}: {
  params: { id: string };
}) {
  const matter = await getMatterDetail(params.id);
  if (!matter) notFound();

  const readyBriefs = matter.context_briefs.filter((b) => b.status === "ready").length;
  const totalBriefs = matter.context_briefs.length;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Description */}
      {matter.description && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Description
          </h2>
          <div className="bg-white border border-brand-grey rounded-xl p-5">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {matter.description}
            </p>
          </div>
        </section>
      )}

      {/* Jurisdictions */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Jurisdictions
          <span className="ml-2 normal-case font-normal text-gray-400">
            ({matter.matter_jurisdictions.length})
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {matter.matter_jurisdictions.map((j) => (
            <div
              key={j.id}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-brand-grey rounded-lg text-sm text-gray-700"
            >
              <span>{j.jurisdiction_name}</span>
              <span className="text-xs text-gray-400">{j.jurisdiction_code}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Context briefs summary */}
      {totalBriefs > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Context briefs
          </h2>
          <div className="bg-white border border-brand-grey rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {readyBriefs} of {totalBriefs} brief{totalBriefs !== 1 ? "s" : ""} ready
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                AI-generated jurisdiction intelligence
              </p>
            </div>
            <Link
              href={`/matters/${matter.id}/context`}
              className="text-sm text-brand-purple font-medium hover:underline"
            >
              View all →
            </Link>
          </div>
        </section>
      )}

      {/* Team */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Team
          <span className="ml-2 normal-case font-normal text-gray-400">
            ({matter.matter_team.length} member{matter.matter_team.length !== 1 ? "s" : ""})
          </span>
        </h2>
        <div className="space-y-2">
          {matter.matter_team.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </section>

      {/* Metadata */}
      <section className="text-xs text-gray-400 border-t border-brand-grey pt-4">
        Matter ID: <span className="font-mono">{matter.id}</span>
        <span className="mx-2">·</span>
        Created{" "}
        {new Date(matter.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </section>
    </div>
  );
}
