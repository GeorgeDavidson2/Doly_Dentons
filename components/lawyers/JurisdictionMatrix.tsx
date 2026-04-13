import { Star } from "lucide-react";
import type { LawyerJurisdiction } from "@/types";

const expertiseColors: Record<number, string> = {
  1: "bg-gray-100 text-gray-500 border-gray-200",
  2: "bg-gray-100 text-gray-600 border-gray-300",
  3: "bg-blue-50 text-blue-600 border-blue-200",
  4: "bg-brand-purple/10 text-brand-purple border-brand-purple/20",
  5: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function JurisdictionMatrix({
  jurisdictions,
}: {
  jurisdictions: LawyerJurisdiction[];
}) {
  if (jurisdictions.length === 0) {
    return <p className="text-sm text-gray-400">No jurisdictions listed.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand-grey">
            <th className="text-left py-2 pr-4 text-xs font-medium text-gray-400 uppercase tracking-wide w-20">
              Code
            </th>
            <th className="text-left py-2 pr-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
              Jurisdiction
            </th>
            <th className="text-left py-2 pr-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
              Expertise
            </th>
            <th className="text-left py-2 pr-4 text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">
              Matter Types
            </th>
            <th className="text-right py-2 text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">
              Yrs
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {jurisdictions.map((j) => (
            <tr key={j.jurisdiction_code} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4">
                <span
                  className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${expertiseColors[j.expertise_level]}`}
                >
                  {j.jurisdiction_code}
                </span>
              </td>
              <td className="py-3 pr-4 text-gray-700 font-medium">{j.jurisdiction_name}</td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < j.expertise_level
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </td>
              <td className="py-3 pr-4 hidden sm:table-cell">
                <div className="flex flex-wrap gap-1">
                  {j.matter_types.slice(0, 3).map((type) => (
                    <span
                      key={type}
                      className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded"
                    >
                      {type}
                    </span>
                  ))}
                  {j.matter_types.length > 3 && (
                    <span className="text-xs text-gray-400">+{j.matter_types.length - 3}</span>
                  )}
                </div>
              </td>
              <td className="py-3 text-right text-gray-500 hidden sm:table-cell">
                {j.years_experience}y
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
