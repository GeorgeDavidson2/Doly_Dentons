"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ReputationEvent {
  points: number;
  created_at: string;
}

interface Props {
  events: ReputationEvent[];
  currentScore: number;
}

export default function ReputationChart({ events, currentScore }: Props) {
  // Build cumulative score timeline from oldest to newest
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let running = currentScore;
  // Walk backwards to reconstruct past scores
  const reversed = [...sorted].reverse().map((e) => {
    const score = running;
    running -= e.points;
    return { date: e.created_at, score };
  });

  const chartData = reversed.reverse().map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: d.score,
  }));

  if (chartData.length < 2) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-500 mb-3">Score over time</p>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#702082" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#702082" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
            formatter={(v: number) => [v.toLocaleString(), "Score"]}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#702082"
            strokeWidth={2}
            fill="url(#scoreGradient)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
