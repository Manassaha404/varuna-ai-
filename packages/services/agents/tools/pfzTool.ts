import { tool } from "@openai/agents";
import { z } from "zod";
import { minDistanceToFeature } from "../utils/minDistanceToFeature";

// INCOIS Potential Fishing Zone (PFZ) API
const PFZ_URL =
  "https://incois.gov.in/geoserver/PFZ_Automation/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=PFZ_Automation:pfzlines&outputFormat=application/json";



const parameters = z.object({
  latitude: z
    .number()
    .describe("User's current latitude in decimal degrees (e.g. 19.07)"),
  longitude: z
    .number()
    .describe("User's current longitude in decimal degrees (e.g. 72.87)"),
  count: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(3)
    .describe("Number of nearest fishing zones to return (default: 3)"),
});

type parametersType = z.infer<typeof parameters>;

const executeFn = async ({ latitude, longitude, count }: parametersType) => {
  // 1. Fetch all PFZ zones
  let data: any;
  try {
    const response = await fetch(PFZ_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    data = await response.json();
  } catch (err: any) {
    return {
      error: `Failed to fetch PFZ data: ${err.message}`,
      zones: [],
    };
  }

  const features: any[] = data?.features ?? [];
  if (features.length === 0) {
    return {
      error: "No PFZ zones found in the API response.",
      zones: [],
    };
  }

  // 2. Compute distance from user to each zone
  const zonesWithDistance = features
    .map((feature) => {
      const coords: number[][][] = feature.geometry?.coordinates ?? [];
      const props = feature.properties ?? {};
      const distanceKm = minDistanceToFeature(latitude, longitude, coords);

      // Pick a representative point (first coordinate of first line)
      // GeoJSON order: [longitude, latitude]
      const firstPoint = coords[0]?.[0] ?? [0, 0];

      return {
        id: feature.id as string,
        sno: props.Sno as string,
        sector: props.SECTORBOUN as number,
        year: props.Year as number,
        julianDay: props.Julian_day as string,
        lengthKm: Number((props.Length as number).toFixed(2)),
        distanceKm: Number(distanceKm.toFixed(2)),
        longitude: firstPoint[0], // GeoJSON index 0 = longitude
        latitude: firstPoint[1], // GeoJSON index 1 = latitude
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);

  return {
    userLocation: { latitude, longitude },
    nearestZones: zonesWithDistance,
    message: `Found ${zonesWithDistance.length} nearest fishing zone(s) out of ${features.length} total zones.`,
  };
};

export const pfzTool = tool({
  name: "find_nearest_fishing_zones",
  description:
    "Finds the nearest Potential Fishing Zones (PFZ) from the user's current location using INCOIS data. Returns the closest fishing zones with their distances.",
  parameters,
  execute: executeFn,
});
