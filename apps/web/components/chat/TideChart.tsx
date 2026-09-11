"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { TideExtremePoint } from "@/hook/chat/useAgentChat";

interface TideChartProps {
  tideExtremes: TideExtremePoint[];
}

// ─── Custom tooltip ────────────────────────────────────────────────────────

function TideTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { type: string } }>;
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;
  const { value, payload: inner } = payload[0];
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1 font-semibold text-zinc-300">{label}</p>
      <p className={inner.type === "High" ? "text-blue-400" : "text-teal-400"}>
        {inner.type === "High" ? "⬆ High" : "⬇ Low"} tide: {value.toFixed(2)} m
      </p>
    </div>
  );
}

// ─── X-axis label formatter ────────────────────────────────────────────────

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export function TideChart({ tideExtremes }: TideChartProps) {
  const data = tideExtremes.map((t) => ({
    time: formatTime(t.time),
    height: t.height,
    type: t.type,
    rawTime: t.time,
  }));

  const maxHeight = Math.max(...tideExtremes.map((t) => t.height), 0);
  const minHeight = Math.min(...tideExtremes.map((t) => t.height), 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-semibold text-zinc-200">🌊 Tide Extremes</span>
        <span className="text-xs text-zinc-500">High / Low tide schedule</span>
        <div className="ml-auto flex gap-3 text-xs">
          <span className="flex items-center gap-1 text-blue-400">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-400" /> High
          </span>
          <span className="flex items-center gap-1 text-teal-400">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-400" /> Low
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 40 }}>
          <defs>
            <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: "#71717a", fontSize: 9 }}
            angle={-35}
            textAnchor="end"
            interval={0}
            tickLine={false}
            axisLine={{ stroke: "#27272a" }}
          />
          <YAxis
            domain={[Math.floor(minHeight - 0.2), Math.ceil(maxHeight + 0.2)]}
            tick={{ fill: "#71717a", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}m`}
          />
          <Tooltip content={<TideTooltip />} />
          <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="height"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#tideGradient)"
            dot={(props) => {
              const { cx, cy, payload } = props as {
                cx: number;
                cy: number;
                payload: { type: string };
              };
              const isHigh = payload.type === "High";
              return (
                <circle
                  key={`dot-${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={isHigh ? "#3b82f6" : "#0d9488"}
                  stroke="#1c1c1c"
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{ r: 6, fill: "#60a5fa", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
