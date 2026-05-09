"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUSES = ["active", "completed", "archived"] as const;
type MatterStatus = typeof STATUSES[number];

export default function MatterStatusSelect({
  matterId,
  initialStatus,
}: {
  matterId: string;
  initialStatus: MatterStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<MatterStatus>(initialStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: MatterStatus) {
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

  return (
    <div className="relative">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as MatterStatus)}
        disabled={saving}
        aria-label="Matter status"
        className={`text-[11px] font-medium pl-2 pr-6 py-0.5 rounded-full border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-purple/40 disabled:opacity-60 ${
          STATUS_STYLES[status] ?? STATUS_STYLES.active
        }`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
