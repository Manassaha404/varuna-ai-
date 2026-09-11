"use client";

import { useEffect, useRef } from "react";
import type { MapLayer } from "@/hook/chat/useAgentChat";
import type { LAYER_STYLES } from "./MapView";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Leaflet needs to be imported at runtime (no SSR)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const L = typeof window !== "undefined" ? require("leaflet") : null;

interface LeafletMapInnerProps {
  center: [number, number];
  zoom: number;
  mapLayers: MapLayer[];
  queryLocation: { latitude: number; longitude: number; placeName: string | null } | null;
  layerStyles: typeof LAYER_STYLES;
}

// Fix Leaflet default marker icon path (broken by webpack)
function fixLeafletIcon() {
  if (!L) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export default function LeafletMapInner({
  center,
  zoom,
  mapLayers,
  queryLocation,
  layerStyles,
}: LeafletMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof L.map> | null>(null);

  useEffect(() => {
    if (!L || !containerRef.current) return;
    fixLeafletIcon();

    // Initialize map
    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: false,
    });
    mapRef.current = map;

    // ── Free tile layer: OpenStreetMap + CSS dark-mode filter ──────────────
    // CartoDB Dark Matter requires an API key; OSM is completely free.
    // We achieve a dark look by inverting + hue-rotating the tile layer element.
    const tileLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        subdomains: "abc",
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }
    ).addTo(map);

    // Apply dark-mode CSS filter to the tile pane so GeoJSON layers stay unaffected
    const tilePaneEl = map.getPanes().tilePane as HTMLElement | null;
    if (tilePaneEl) {
      tilePaneEl.style.filter = "invert(100%) hue-rotate(180deg) brightness(0.85) contrast(0.9)";
    }

    // Compact attribution
    L.control.attribution({ prefix: false }).addTo(map);

    // ── Query location marker ──────────────────────────────────────────────
    if (queryLocation) {
      const pulseIcon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:20px;height:20px;">
            <div style="
              position:absolute;inset:0;border-radius:50%;
              background:rgba(59,130,246,0.35);
              animation:pulse 2s ease-in-out infinite;
            "></div>
            <div style="
              position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
              width:10px;height:10px;border-radius:50%;
              background:#3b82f6;border:2px solid #fff;
            "></div>
          </div>
          <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(2.2);opacity:0}}</style>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker(
        [queryLocation.latitude, queryLocation.longitude],
        { icon: pulseIcon }
      )
        .addTo(map)
        .bindPopup(
          `<b>${queryLocation.placeName ?? "Query Location"}</b><br/>` +
          `${queryLocation.latitude.toFixed(4)}°N, ${queryLocation.longitude.toFixed(4)}°E`
        );
    }

    // ── GeoJSON layers ─────────────────────────────────────────────────────
    for (const layer of mapLayers) {
      const style = layerStyles[layer.type];
      if (!style) continue;

      let parsed: object | null = null;
      try {
        parsed = JSON.parse(layer.geojson);
      } catch {
        console.warn("[LeafletMapInner] Failed to parse GeoJSON for layer:", layer.type);
        continue;
      }

      L.geoJSON(parsed, {
        style: () => ({
          color: style.color,
          fillColor: style.fillColor,
          fillOpacity: 0.18,
          weight: 2,
          opacity: 0.8,
        }),
        pointToLayer: (_feature: unknown, latlng: unknown) =>
          L.circleMarker(latlng, {
            radius: 7,
            color: style.color,
            fillColor: style.fillColor,
            fillOpacity: 0.7,
            weight: 2,
          }),
        onEachFeature: (feature: { properties?: Record<string, string> }, featureLayer: ReturnType<typeof L.geoJSON>) => {
          const props = feature.properties ?? {};
          const label =
            props["name"] ??
            props["title"] ??
            props["description"] ??
            style.label;
          featureLayer.bindPopup(
            `<span style="font-weight:600;color:${style.color}">${style.emoji} ${label}</span>`
          );
        },
      }).addTo(map);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only mount once — parent re-mounts component on data change

  return <div ref={containerRef} style={{ height: "100%", width: "100%", background: "#1a1a2e" }} />;
}
