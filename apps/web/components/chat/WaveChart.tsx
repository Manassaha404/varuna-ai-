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
import type { WaveHeightPoint } from "@/hook/chat/useAgentChat";

const DANGER_THRESHOLD = 2.5; // metres — matches risk agent rule

interface WaveChartProps {
  waveHeights: WaveHeightPoint[];
}

// ─── Custom tooltip ────────────────────────────────────────────────────────

function WaveTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;
  const value = payload[0].value;
  const isDangerous = value >= DANGER_THRESHOLD;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1 font-semibold text-zinc-300">{label}</p>
      <p className={isDangerous ? "text-red-400" : "text-cyan-400"}>
        {isDangerous ? "⚠ " : ""}Wave height: {value.toFixed(2)} m
        {isDangerous && <span className="ml-1 font-medium">(CAUTION)</span>}
      </p>
    </div>
  );
}

// ─── Formatter ─────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export function WaveChart({ waveHeights }: WaveChartProps) {
  // Limit to 24 points for readability (show ~24 h of forecast)
  const data = waveHeights.slice(0, 24).map((w) => ({
    time: formatTime(w.time),
    height: w.height,
  }));

  const maxHeight = Math.max(...waveHeights.map((w) => w.height), 0);
  const hasDanger = maxHeight >= DANGER_THRESHOLD;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-semibold text-zinc-200">📈 Wave Heights</span>
        <span className="text-xs text-zinc-500">Significant wave height forecast</span>
        {hasDanger && (
          <span className="ml-auto rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">
            ⚠ Exceeds 2.5m
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 40 }}>
          <defs>
            <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="waveDangerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: "#71717a", fontSize: 9 }}
            angle={-35}
            textAnchor="end"
            interval={2}
            tickLine={false}
            axisLine={{ stroke: "#27272a" }}
          />
          <YAxis
            domain={[0, Math.ceil(maxHeight + 0.5)]}
            tick={{ fill: "#71717a", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}m`}
          />
          <Tooltip content={<WaveTooltip />} />
          {/* Danger threshold reference line */}
          <ReferenceLine
            y={DANGER_THRESHOLD}
            stroke="#ef4444"
            strokeDasharray="6 3"
            strokeOpacity={0.6}
            label={{
              value: "⚠ 2.5m",
              position: "insideTopRight",
              fill: "#ef4444",
              fontSize: 10,
            }}
          />
          <Area
            type="monotone"
            dataKey="height"
            stroke={hasDanger ? "#f87171" : "#06b6d4"}
            strokeWidth={2}
            fill={hasDanger ? "url(#waveDangerGradient)" : "url(#waveGradient)"}
            dot={false}
            activeDot={{ r: 5, fill: hasDanger ? "#f87171" : "#22d3ee", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
