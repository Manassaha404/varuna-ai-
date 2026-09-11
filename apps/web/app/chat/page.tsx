"use client";

import { useRef, useEffect, useState, lazy, Suspense } from "react";
import { useAgentChat } from "@/hook/chat/useAgentChat";
import { TideChart } from "@/components/chat/TideChart";
import { WaveChart } from "@/components/chat/WaveChart";
import { EvidencePanel } from "@/components/chat/EvidencePanel";
import dynamic from "next/dynamic";

// MapView is dynamically imported (Leaflet = browser-only)
const MapView = dynamic(
  () => import("@/components/chat/MapView").then((m) => ({ default: m.MapView })),
  { ssr: false }
);

// ─── Safety badge colors ───────────────────────────────────────────────────

const verdictConfig = {
  safe:    { label: "SAFE",    bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400", bar: "from-emerald-500" },
  caution: { label: "CAUTION", bg: "bg-amber-500/15",   text: "text-amber-400",   dot: "bg-amber-400",   bar: "from-amber-500"   },
  unsafe:  { label: "UNSAFE",  bg: "bg-red-500/15",     text: "text-red-400",     dot: "bg-red-400",     bar: "from-red-500"     },
  unknown: { label: "UNKNOWN", bg: "bg-zinc-500/15",    text: "text-zinc-400",    dot: "bg-zinc-400",    bar: "from-zinc-500"   },
} as const;

const alertSeverityConfig = {
  info:    { border: "border-blue-400/30",  text: "text-blue-300",  icon: "ℹ"  },
  warning: { border: "border-amber-400/30", text: "text-amber-300", icon: "⚠"  },
  severe:  { border: "border-red-400/30",   text: "text-red-300",   icon: "🚨" },
} as const;

// ─── Thinking dots animation ───────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-2 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-blue-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ─── Tab type ─────────────────────────────────────────────────────────────

type VisualizationTab = "map" | "charts" | "evidence";

// ─── Visualization tab strip ──────────────────────────────────────────────

function VisualizationTabs({
  active,
  onChange,
  hasMap,
  hasCharts,
  hasEvidence,
}: {
  active: VisualizationTab;
  onChange: (t: VisualizationTab) => void;
  hasMap: boolean;
  hasCharts: boolean;
  hasEvidence: boolean;
}) {
  const tabs: { id: VisualizationTab; label: string; icon: string }[] = [
    { id: "map",      label: "Map",      icon: "🗺️" },
    { id: "charts",   label: "Charts",   icon: "📊" },
    { id: "evidence", label: "Sources",  icon: "📋" },
  ];

  const available = tabs.filter((t) =>
    t.id === "map"      ? hasMap :
    t.id === "charts"   ? hasCharts :
    t.id === "evidence" ? hasEvidence :
    false
  );

  if (available.length === 0) return null;

  return (
    <div className="mt-3 flex gap-1 rounded-xl border border-white/10 bg-zinc-950/60 p-1">
      {available.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            active === tab.id
              ? "bg-blue-500/20 text-blue-300 shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Assistant message renderer ────────────────────────────────────────────

function AssistantMessage({
  text,
  agentData,
  isThinking,
  isError,
}: {
  text: string;
  agentData?: ReturnType<typeof useAgentChat>["messages"][number]["agentData"];
  isThinking?: boolean;
  isError?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<VisualizationTab>("map");

  if (isThinking) return <ThinkingDots />;

  const verdict = agentData?.safetyVerdict
    ? verdictConfig[agentData.safetyVerdict] ?? verdictConfig.unknown
    : null;

  // ── Determine which visualization tabs have data ───────────────────────
  const hasMap =
    !!(agentData?.queryLocation) ||
    !!(agentData?.mapLayers && agentData.mapLayers.length > 0);
  const hasTideChart = !!(agentData?.chartData?.tideExtremes?.length);
  const hasWaveChart = !!(agentData?.chartData?.waveHeights?.length);
  const hasCharts = hasTideChart || hasWaveChart;
  const hasEvidence = !!(agentData?.evidence && agentData.evidence.length > 0);
  const hasAnyVisualization = hasMap || hasCharts || hasEvidence;

  // Default to first available tab
  useEffect(() => {
    if (hasMap) setActiveTab("map");
    else if (hasCharts) setActiveTab("charts");
    else if (hasEvidence) setActiveTab("evidence");
  }, [hasMap, hasCharts, hasEvidence]);

  return (
    <div className="space-y-3">
      {/* Safety verdict badge */}
      {verdict && (
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wider ${verdict.bg} ${verdict.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${verdict.dot}`} />
          {verdict.label}
        </div>
      )}

      {/* Main summary */}
      <p className={`text-[15px] leading-7 ${isError ? "text-red-400" : "text-zinc-200"}`}>
        {text || agentData?.summary}
      </p>

      {/* Alerts */}
      {agentData?.alerts && agentData.alerts.length > 0 && (
        <div className="space-y-2">
          {agentData.alerts.map((alert, i) => {
            const cfg = alertSeverityConfig[alert.severity];
            return (
              <div
                key={i}
                className={`flex gap-2 rounded-xl border ${cfg.border} bg-white/5 px-3 py-2.5 text-sm ${cfg.text}`}
              >
                <span className="shrink-0">{cfg.icon}</span>
                <span>{alert.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Recommendations */}
      {agentData?.recommendations && agentData.recommendations.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Recommendations
          </p>
          <ul className="space-y-1.5">
            {agentData.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Visualization panel ──────────────────────────────────────────── */}
      {hasAnyVisualization && agentData && (
        <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-3">
          {/* Tab strip */}
          <VisualizationTabs
            active={activeTab}
            onChange={setActiveTab}
            hasMap={hasMap}
            hasCharts={hasCharts}
            hasEvidence={hasEvidence}
          />

          {/* Tab content */}
          <div className="mt-3">
            {/* MAP TAB */}
            {activeTab === "map" && hasMap && (
              <MapView
                queryLocation={agentData.queryLocation ?? null}
                mapLayers={agentData.mapLayers ?? null}
              />
            )}

            {/* CHARTS TAB */}
            {activeTab === "charts" && hasCharts && (
              <div className="space-y-3">
                {hasTideChart && (
                  <TideChart tideExtremes={agentData.chartData!.tideExtremes!} />
                )}
                {hasWaveChart && (
                  <WaveChart waveHeights={agentData.chartData!.waveHeights!} />
                )}
              </div>
            )}

            {/* EVIDENCE TAB */}
            {activeTab === "evidence" && hasEvidence && (
              <EvidencePanel evidence={agentData.evidence} />
            )}
          </div>
        </div>
      )}

      {/* Location & time horizon footer */}
      {(agentData?.queryLocation || agentData?.queryTimeHorizon) && (
        <div className="flex flex-wrap gap-3 text-xs text-zinc-600">
          {agentData.queryLocation?.placeName && (
            <span>📍 {agentData.queryLocation.placeName}</span>
          )}
          {agentData.queryLocation && (
            <span>
              {agentData.queryLocation.latitude.toFixed(2)}°N,{" "}
              {agentData.queryLocation.longitude.toFixed(2)}°E
            </span>
          )}
          {agentData.queryTimeHorizon && (
            <span>🕐 {agentData.queryTimeHorizon}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { messages, isLoading, isClearing, apiError, sendMessage, newChat, setApiError, locationStatus, locationEnabled, toggleLocation } =
    useAgentChat();

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function handleSend() {
    const text = inputRef.current?.value.trim();
    if (!text) return;
    sendMessage(text);
    if (inputRef.current) inputRef.current.value = "";
    setApiError(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6 sm:px-10">
        <div className="text-xl font-semibold tracking-tight">
          Varuna<span className="text-blue-400">AI</span>
        </div>

        <div className="flex items-center gap-3">
          {/* New Chat button */}
          <button
            type="button"
            id="new-chat-btn"
            onClick={newChat}
            disabled={isLoading || isClearing}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-300 transition hover:border-blue-400/40 hover:bg-blue-400/10 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Start a new chat"
          >
            {isClearing ? (
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
            New Chat
          </button>

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-400">
            Marine Intelligence
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 pb-36 pt-8 sm:px-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-6 flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="flex max-w-[92%] items-start gap-3">
                  {/* Assistant Avatar */}
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-400/20 bg-blue-400/10 text-sm text-blue-300">
                    ✦
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="mb-1 text-xs font-medium text-zinc-500">
                      VarunaAI
                    </div>
                    <div className="rounded-2xl rounded-tl-md border border-white/10 bg-zinc-900 px-4 py-3">
                      <AssistantMessage
                        text={message.text}
                        agentData={message.agentData}
                        isThinking={message.isThinking}
                        isError={message.isError}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-[75%] rounded-2xl rounded-tr-md bg-blue-500 px-4 py-3 text-[15px] leading-7 text-white">
                  {message.text}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/95 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto max-w-3xl">
          {apiError && (
            <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 border border-red-500/20">
              {apiError}
            </p>
          )}

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 p-2 transition focus-within:border-blue-400/40">
            <input
              ref={inputRef}
              type="text"
              id="chat-input"
              defaultValue=""
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask about fishing conditions, hazards, tides…"
              className="h-11 flex-1 bg-transparent px-3 text-[15px] text-white outline-none placeholder:text-zinc-500 disabled:opacity-50"
            />

            {/* ── Location toggle pill ─────────────────────────────────── */}
            {(() => {
              const canToggle = locationStatus !== "unavailable";
              const isDenied = locationStatus === "denied";
              const isGranted = locationStatus === "granted";
              const isResolving = locationStatus === "resolving";

              const dotColor = !locationEnabled
                ? "bg-zinc-600"
                : isDenied
                ? "bg-amber-400"
                : isGranted
                ? "bg-emerald-400"
                : isResolving
                ? "bg-blue-400 animate-pulse"
                : "bg-zinc-500";

              const label = !locationEnabled
                ? "Location off"
                : isDenied
                ? "Denied"
                : isGranted
                ? "Location on"
                : isResolving
                ? "Locating…"
                : "No location";

              const title = isDenied
                ? "Browser denied location access. Enable in site settings to share."
                : !canToggle
                ? "Location not available on this device."
                : locationEnabled
                ? "Click to stop sharing your location with the AI"
                : "Click to share your location with the AI";

              return (
                <button
                  type="button"
                  id="location-toggle-btn"
                  onClick={canToggle && !isDenied ? toggleLocation : undefined}
                  title={title}
                  disabled={isLoading || !canToggle || isDenied}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    locationEnabled && isGranted
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : isDenied
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400 cursor-not-allowed"
                      : !locationEnabled
                      ? "border-zinc-700 bg-zinc-800/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                      : "border-zinc-700 bg-zinc-800/60 text-zinc-500"
                  } disabled:opacity-50`}
                  aria-label={label}
                  aria-pressed={locationEnabled}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                  <span className="hidden sm:inline">{label}</span>
                  {/* On small screens just show the icon */}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="sm:hidden"
                  >
                    <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </button>
              );
            })()}


            <button
              type="button"
              id="chat-send-btn"
              onClick={handleSend}
              disabled={isLoading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              {isLoading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              )}
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-zinc-600">
            VarunaAI uses live marine data. Always verify with local authorities.
          </p>
        </div>
      </div>
    </main>
  );
}
