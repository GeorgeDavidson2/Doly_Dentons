"use client";

import { useMemo } from "react";
import { toZonedTime } from "date-fns-tz";
import { getHours, getMinutes } from "date-fns";
import type { Lawyer } from "@/types";

interface TeamMember {
  lawyer: Pick<Lawyer, "id" | "full_name" | "office_city" | "timezone">;
  available_now: boolean;
}

interface Props {
  teamMembers: TeamMember[];
  now?: Date;
}

const WORK_START = 9;
const WORK_END = 18;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getOffsetHours(timezone: string): number {
  try {
    const now = new Date();
    const local = toZonedTime(now, timezone);
    const utcMs = now.getTime();
    const localMs =
      Date.UTC(
        local.getFullYear(),
        local.getMonth(),
        local.getDate(),
        local.getHours(),
        local.getMinutes()
      );
    return Math.round((localMs - utcMs) / (1000 * 60 * 60));
  } catch {
    return 0;
  }
}

export default function TimezoneTimeline({ teamMembers, now = new Date() }: Props) {
  const utcHour = useMemo(() => {
    return getHours(now) + getMinutes(now) / 60;
  }, [now]);

  if (!teamMembers.length) return null;

  // Deduplicate by timezone
  const unique = teamMembers.filter(
    (m, idx, arr) => arr.findIndex((x) => x.lawyer.timezone === m.lawyer.timezone) === idx
  );

  // Sort by UTC offset
  const sorted = [...unique].sort(
    (a, b) => getOffsetHours(a.lawyer.timezone) - getOffsetHours(b.lawyer.timezone)
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Hour labels */}
        <div className="flex mb-2 pl-36">
          {[0, 6, 12, 18].map((h) => (
            <div key={h} className="flex-1 text-[10px] text-gray-400">
              {h === 0 ? "12am" : h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h - 12}pm`}
            </div>
          ))}
          <div className="text-[10px] text-gray-400">12am</div>
        </div>

        {/* Lawyer rows */}
        {sorted.map(({ lawyer, available_now }) => {
          const offset = getOffsetHours(lawyer.timezone);
          const localHour = (utcHour + offset + 24) % 24;
          const isWorking = localHour >= WORK_START && localHour < WORK_END;
          const nowPct = (localHour / 24) * 100;

          return (
            <div key={lawyer.id} className="flex items-center gap-2 mb-2">
              {/* Name */}
              <div className="w-36 flex-shrink-0 text-right pr-2">
                <p className="text-xs font-medium text-gray-800 truncate">{lawyer.full_name.split(" ")[0]}</p>
                <p className="text-[10px] text-gray-400 truncate">{lawyer.office_city}</p>
              </div>

              {/* Timeline bar */}
              <div className="relative flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                {/* Working hours block */}
                <div
                  className={`absolute top-0 h-full rounded ${isWorking ? "bg-brand-purple/30" : "bg-gray-200"}`}
                  style={{
                    left: `${(WORK_START / 24) * 100}%`,
                    width: `${((WORK_END - WORK_START) / 24) * 100}%`,
                  }}
                />

                {/* Current time indicator */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-brand-purple z-10"
                  style={{ left: `${nowPct}%` }}
                />

                {/* Status label */}
                <div className="absolute inset-0 flex items-center px-2">
                  <span
                    className={`text-[10px] font-semibold ${
                      isWorking ? "text-brand-purple" : "text-gray-400"
                    }`}
                  >
                    {isWorking ? "● Online" : "○ Offline"}
                  </span>
                </div>
              </div>

              {/* UTC offset */}
              <div className="w-12 flex-shrink-0 text-[10px] text-gray-400 text-right">
                UTC{offset >= 0 ? "+" : ""}
                {offset}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="pl-36 mt-3 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-brand-purple/30" />
            <span className="text-[10px] text-gray-500">Working hours (9am–6pm local)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3 bg-brand-purple" />
            <span className="text-[10px] text-gray-500">Now (UTC)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
