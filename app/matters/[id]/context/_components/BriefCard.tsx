"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { JURISDICTIONS } from "@/lib/jurisdictions";

export type Brief = {
  id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  status: "generating" | "ready" | "error";
  legal_landscape: string | null;
  cultural_intelligence: string | null;
  regulatory_notes: string | null;
};

function getFlag(code: string): string {
  return JURISDICTIONS.find((j) => j.code === code)?.flag ?? "";
}

const SECTIONS: { key: keyof Brief; label: string; color: string }[] = [
  { key: "legal_landscape", label: "Legal Landscape", color: "border-brand-purple/40" },
  { key: "cultural_intelligence", label: "Cultural Intelligence", color: "border-blue-300" },
  { key: "regulatory_notes", label: "Regulatory Notes", color: "border-green-300" },
];

function Section({
  sectionId,
  label,
  color,
  content,
  defaultOpen,
}: {
  sectionId: string;
  label: string;
  color: string;
  content: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`border-l-2 ${color} pl-4`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={sectionId}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {label}
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      <div id={sectionId} hidden={!open}>
        <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}

export default function BriefCard({ brief }: { brief: Brief }) {
  const flag = getFlag(brief.jurisdiction_code);

  return (
    <div className="bg-white border border-brand-grey rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {flag}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {brief.jurisdiction_name}
            </p>
            <p className="text-xs text-gray-400">{brief.jurisdiction_code}</p>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
          Ready
        </span>
      </div>

      {/* Content sections */}
      {SECTIONS.map((s, i) => {
        const content = brief[s.key] as string | null;
        if (!content) return null;
        return (
          <Section
            key={s.key}
            sectionId={`brief-${brief.id}-${s.key}`}
            label={s.label}
            color={s.color}
            content={content}
            defaultOpen={i === 0}
          />
        );
      })}
    </div>
  );
}
