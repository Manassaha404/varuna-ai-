"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { MapLayer } from "@/hook/chat/useAgentChat";

// ─── Leaflet CSS (must be imported globally or here for dynamic maps) ──────
// We import it inside the dynamic component to avoid SSR issues

interface MapViewProps {
  queryLocation: {
    latitude: number;
    longitude: number;
    placeName: string | null;
  } | null;
  mapLayers: MapLayer[] | null;
}

// ─── Layer type colors ─────────────────────────────────────────────────────

const LAYER_STYLES: Record<
  MapLayer["type"],
  { color: string; fillColor: string; label: string; emoji: string }
> = {
  pfz:      { color: "#22c55e", fillColor: "#22c55e", label: "Potential Fishing Zone", emoji: "🐟" },
  hazard:   { color: "#ef4444", fillColor: "#ef4444", label: "Hazard Zone",            emoji: "⚠️" },
  tide:     { color: "#3b82f6", fillColor: "#3b82f6", label: "Tide Station",           emoji: "🌊" },
  geofence: { color: "#f59e0b", fillColor: "#f59e0b", label: "Protected Zone",         emoji: "🚫" },
  route:    { color: "#06b6d4", fillColor: "#06b6d4", label: "Route",                  emoji: "⛵" },
};

// ─── The actual Leaflet map (SSR-disabled via dynamic import) ──────────────

const LeafletMap = dynamic(() => import("./LeafletMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-zinc-500">
        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-xs">Loading map…</span>
      </div>
    </div>
  ),
});

export function MapView({ queryLocation, mapLayers }: MapViewProps) {
  const center: [number, number] = useMemo(() => {
    if (queryLocation) return [queryLocation.latitude, queryLocation.longitude];
    // Default: center of India
    return [20.5937, 78.9629];
  }, [queryLocation]);

  const hasLayers = mapLayers && mapLayers.length > 0;
  const uniqueTypes = hasLayers
    ? [...new Set(mapLayers.map((l) => l.type))]
    : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
      {/* Map header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">
            🗺️ {queryLocation?.placeName ?? "Marine Chart"}
          </span>
          {queryLocation && (
            <span className="text-xs text-zinc-600">
              {queryLocation.latitude.toFixed(3)}°N, {queryLocation.longitude.toFixed(3)}°E
            </span>
          )}
        </div>
        {/* Legend chips */}
        {uniqueTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {uniqueTypes.map((type) => {
              const style = LAYER_STYLES[type];
              return (
                <span
                  key={type}
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    background: `${style.color}20`,
                    color: style.color,
                    border: `1px solid ${style.color}40`,
                  }}
                >
                  {style.emoji} {style.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Map container */}
      {/* Map container — isolation:isolate keeps Leaflet z-indices from escaping */}
      <div className="relative h-[340px] w-full overflow-hidden" style={{ isolation: "isolate" }}>
        <LeafletMap
          center={center}
          zoom={queryLocation ? 8 : 5}
          mapLayers={mapLayers ?? []}
          queryLocation={queryLocation}
          layerStyles={LAYER_STYLES}
        />
      </div>
    </div>
  );
}

export { LAYER_STYLES };
