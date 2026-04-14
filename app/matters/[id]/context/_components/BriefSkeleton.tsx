import { Loader2 } from "lucide-react";

export default function BriefSkeleton({ jurisdictionName }: { jurisdictionName: string }) {
  return (
    <div className="bg-white border border-brand-grey rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{jurisdictionName}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating intelligence brief…
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-600 border-amber-200">
          Generating
        </span>
      </div>

      {/* Skeleton lines */}
      {[["w-full", "w-5/6", "w-4/5"], ["w-full", "w-3/4"], ["w-full", "w-5/6", "w-2/3"]].map(
        (lines, sectionIdx) => (
          <div key={sectionIdx} className="space-y-2 pt-3 border-t border-gray-100">
            <div className="h-2.5 bg-gray-200 rounded animate-pulse w-32" />
            {lines.map((w, i) => (
              <div key={i} className={`h-2 bg-gray-100 rounded animate-pulse ${w}`} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
