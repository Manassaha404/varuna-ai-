"use client";

import { useState } from "react";
import type { AgentEvidence } from "@/hook/chat/useAgentChat";

interface EvidencePanelProps {
  evidence: AgentEvidence[];
}

const SOURCE_ICONS: Record<string, string> = {
  "INCOIS PFZ Advisory":      "🐟",
  "Open-Meteo Marine Forecast": "🌦️",
  "GDACS Hazard Alerts":      "⚠️",
  "WorldTides Tidal Data":    "🌊",
  "ArcGIS Marine Protected Areas": "🛡️",
};

function getSourceIcon(source: string) {
  for (const [key, icon] of Object.entries(SOURCE_ICONS)) {
    if (source.toLowerCase().includes(key.toLowerCase().split(" ")[0]!.toLowerCase())) {
      return icon;
    }
  }
  return "📡";
}

function formatTimestamp(ts: string | null) {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return ts;
  }
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  const [open, setOpen] = useState(false);

  if (!evidence || evidence.length === 0) return null;

  const hasErrors = evidence.some((e) => e.finding.toLowerCase().startsWith("data unavailable"));

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            📋 Data Sources
          </span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
            {evidence.length}
          </span>
          {hasErrors && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-400">
              ⚠ Some unavailable
            </span>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Evidence list */}
      {open && (
        <div className="border-t border-white/10">
          {evidence.map((ev, i) => {
            const isError = ev.finding.toLowerCase().startsWith("data unavailable");
            const icon = getSourceIcon(ev.source);
            const ts = formatTimestamp(ev.dataTimestamp);
            return (
              <div
                key={i}
                className={`border-b border-white/5 px-4 py-3 last:border-0 ${
                  isError ? "opacity-60" : ""
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                    <span>{icon}</span>
                    {ev.source}
                  </span>
                  {ts && (
                    <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">
                      {ts} IST
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs leading-5 ${
                    isError ? "text-amber-400/70" : "text-zinc-400"
                  }`}
                >
                  {ev.finding}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
