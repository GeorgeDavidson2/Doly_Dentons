"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Circle, CheckCircle2, Archive, Loader2 } from "lucide-react";

type MatterStatus = "active" | "completed" | "archived";

const STATUS_CONFIG: Record<MatterStatus, {
  label: string;
  icon: React.ElementType;
  pill: string;
  optionHover: string;
  dot: string;
}> = {
  active: {
    label: "Active",
    icon: Circle,
    pill: "bg-green-50 text-green-700 border-green-200",
    optionHover: "hover:bg-green-50",
    dot: "bg-green-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    pill: "bg-blue-50 text-blue-700 border-blue-200",
    optionHover: "hover:bg-blue-50",
    dot: "bg-blue-500",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    pill: "bg-gray-100 text-gray-500 border-gray-200",
    optionHover: "hover:bg-gray-50",
    dot: "bg-gray-400",
  },
};

const STATUSES: MatterStatus[] = ["active", "completed", "archived"];

export default function MatterStatusSelect({
  matterId,
  initialStatus,
}: {
  matterId: string;
  initialStatus: MatterStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<MatterStatus>(initialStatus);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSelect(next: MatterStatus) {
    setOpen(false);
    if (next === status || saving) return;
    const prev = status;
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/matters/${matterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setStatus(prev);
      } else {
        router.refresh();
      }
    } catch {
      setStatus(prev);
    } finally {
      setSaving(false);
    }
  }

  const current = STATUS_CONFIG[status];

  return (
    <div ref={ref} className="relative">
      {/* Trigger pill */}
      <button
        type="button"
        onClick={() => !saving && setOpen((v) => !v)}
        disabled={saving}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change matter status"
        className={`inline-flex items-center gap-1.5 text-[11px] font-medium pl-2.5 pr-2 py-0.5 rounded-full border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/40 disabled:opacity-60 disabled:cursor-not-allowed ${current.pill}`}
      >
        {saving ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${current.dot}`} />
        )}
        {current.label}
        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1.5 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden"
        >
          {STATUSES.map((s) => {
            const config = STATUS_CONFIG[s];
            const Icon = config.icon;
            const isActive = s === status;
            return (
              <button
                key={s}
                role="option"
                aria-selected={isActive}
                type="button"
                onClick={() => handleSelect(s)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${config.optionHover} ${
                  isActive ? "font-semibold text-gray-900" : "text-gray-600 font-medium"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-brand-purple" : "text-gray-400"}`} />
                {config.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-purple" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
