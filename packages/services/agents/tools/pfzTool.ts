import { tool } from "@openai/agents";
import { z } from "zod";
import { minDistanceToFeature } from "../utils/minDistanceToFeature.js";

// ─── INCOIS Potential Fishing Zone (PFZ) WFS endpoint ────────────────────

const PFZ_URL =
  "https://incois.gov.in/geoserver/PFZ_Automation/ows" +
  "?service=WFS&version=1.1.0&request=GetFeature" +
  "&typeName=PFZ_Automation:pfzlines&outputFormat=application/json";

// ─── Schema ───────────────────────────────────────────────────────────────

const parameters = z.object({
  latitude: z
    .number()
    .describe("User's current latitude in decimal degrees (e.g. 19.07)"),
  longitude: z
    .number()
    .describe("User's current longitude in decimal degrees (e.g. 72.87)"),
  radiusKm: z
    .number()
    .optional()
    .describe("Only return zones within this radius in km (default: no filter)"),
  count: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .describe("Maximum number of nearest fishing zones to return (default: 5)"),
});

type ParametersType = z.infer<typeof parameters>;

// ─── Feature type (based on actual INCOIS WFS response) ──────────────────

interface PfzProperties {
  Shape_Leng?: number | null;
  Shape_Area?: number | null;
  State_Name?: string | null;
  SECTORBOUN?: string | null;
  SECTORBO_1?: string | null;
  Julian_day?: string | null;
  Sno?: string | null;
  Year?: number | null;
  UID?: string | null;
  Length?: number | null;
}

interface PfzFeature {
  type: string;
  id?: string;
  geometry: {
    type: string;
    coordinates: number[][][]; // MultiLineString: [line][point][lon, lat]
  };
  properties: PfzProperties;
}

interface PfzFeatureCollection {
  type: string;
  features: PfzFeature[];
}

// ─── Execute ──────────────────────────────────────────────────────────────

const executeFn = async ({
  latitude,
  longitude,
  radiusKm,
  count,
}: ParametersType) => {
  const timestamp = new Date().toISOString();

  // 1. Fetch all PFZ zones from INCOIS
  let data: PfzFeatureCollection;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    const response = await fetch(PFZ_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    data = (await response.json()) as PfzFeatureCollection;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[pfzTool] Fetch failed:", msg);
    return {
      error: `Failed to fetch PFZ data from INCOIS: ${msg}`,
      zones: [],
      dataTimestamp: timestamp,
    };
  }

  const features = data?.features ?? [];
  if (features.length === 0) {
    return {
      error: "INCOIS returned an empty feature collection — no PFZ data today.",
      zones: [],
      dataTimestamp: timestamp,
    };
  }

  // 2. Compute distance + filter by radiusKm
  const zonesWithDistance = features
    .map((feature) => {
      const coords = feature.geometry?.coordinates ?? [];
      const props = feature.properties ?? {};

      // Safe distance computation — skip features with no coordinates
      if (!coords.length) return null;

      const distanceKm = minDistanceToFeature(latitude, longitude, coords);

      // Representative point: first vertex of first line segment
      const firstPoint = coords[0]?.[0] ?? [longitude, latitude];

      return {
        id: feature.id ?? null,
        sno: props.Sno ?? null,
        stateName: props.State_Name ?? null,
        sector: props.SECTORBOUN ?? null,
        year: props.Year ?? null,
        julianDay: props.Julian_day ?? null,
        uid: props.UID ?? null,
        // Length in km from INCOIS properties (actual fishing zone length)
        lengthKm: props.Length != null ? Number(props.Length.toFixed(2)) : null,
        distanceKm: Number(distanceKm.toFixed(2)),
        // Representative lat/lon (GeoJSON: index 0 = lon, index 1 = lat)
        longitude: firstPoint[0] ?? longitude,
        latitude: firstPoint[1] ?? latitude,
      };
    })
    .filter((z): z is NonNullable<typeof z> => z !== null)
    .filter((z) => (radiusKm != null ? z.distanceKm <= radiusKm : true))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);

  if (zonesWithDistance.length === 0) {
    return {
      userLocation: { latitude, longitude },
      zones: [],
      message: radiusKm
        ? `No PFZ zones found within ${radiusKm} km of the query location out of ${features.length} total zones.`
        : "No PFZ zones available.",
      totalFeaturesFromApi: features.length,
      dataTimestamp: timestamp,
    };
  }

  return {
    userLocation: { latitude, longitude },
    nearestZones: zonesWithDistance,
    message: `Found ${zonesWithDistance.length} nearest PFZ fishing zone(s) out of ${features.length} total today.`,
    totalFeaturesFromApi: features.length,
    dataTimestamp: timestamp,
  };
};

// ─── Tool export ──────────────────────────────────────────────────────────

export const pfzTool = tool({
  name: "find_nearest_fishing_zones",
  description:
    "Finds the nearest Potential Fishing Zones (PFZ) from the user's current location " +
    "using live INCOIS (Indian National Centre for Ocean Information Services) data. " +
    "Returns the closest fishing zones with distances, state names, and GPS coordinates. " +
    "Use radiusKm to filter zones to a specific search radius.",
  parameters,
  execute: executeFn,
});
