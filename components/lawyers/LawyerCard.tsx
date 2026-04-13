import Link from "next/link";
import type { Lawyer, LawyerJurisdiction } from "@/types";

export type LawyerWithJurisdictions = Pick<
  Lawyer,
  "id" | "full_name" | "title" | "office_city" | "office_country" | "languages" | "reputation_score" | "matters_count" | "avatar_url"
> & {
  lawyer_jurisdictions: Pick<LawyerJurisdiction, "jurisdiction_code" | "jurisdiction_name" | "expertise_level">[];
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : name[0];
}

export default function LawyerCard({ lawyer }: { lawyer: LawyerWithJurisdictions }) {
  const topJurisdictions = [...lawyer.lawyer_jurisdictions]
    .sort((a, b) => b.expertise_level - a.expertise_level)
    .slice(0, 3);

  const extraCount = lawyer.lawyer_jurisdictions.length - 3;

  return (
    <Link
      href={`/lawyers/${lawyer.id}`}
      className="bg-white border border-brand-grey rounded-xl p-5 hover:border-brand-purple hover:shadow-sm transition-all group block"
    >
      {/* Avatar + name */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
          {lawyer.avatar_url ? (
            <img
              src={lawyer.avatar_url}
              alt={lawyer.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <span className="text-brand-purple font-semibold text-sm">
              <Initials name={lawyer.full_name} />
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 group-hover:text-brand-purple transition-colors truncate text-sm">
            {lawyer.full_name}
          </p>
          <p className="text-xs text-gray-500 truncate">{lawyer.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {lawyer.office_city}, {lawyer.office_country}
          </p>
        </div>
      </div>

      {/* Jurisdiction badges */}
      {topJurisdictions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {topJurisdictions.map((j) => (
            <span
              key={j.jurisdiction_code}
              className="text-xs px-2 py-0.5 bg-brand-purple/10 text-brand-purple rounded-full border border-brand-purple/20"
            >
              {j.jurisdiction_code}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* Languages + reputation */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 truncate">
          {lawyer.languages.slice(0, 2).join(", ")}
          {lawyer.languages.length > 2 && ` +${lawyer.languages.length - 2}`}
        </p>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-xs font-semibold text-gray-700">
            {lawyer.reputation_score.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400 ml-0.5">pts</span>
        </div>
      </div>
    </Link>
  );
}
