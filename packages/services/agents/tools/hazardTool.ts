import { tool } from "@openai/agents";
import { z } from "zod";

const IMD_MARINE_URL =
  "https://mausam.imd.gov.in/responsive/marine_forecast.php";

const ALERT_RADIUS_KM = 200;

const ZONE_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  "arabian sea": { lat: 14.0, lon: 67.0 },
  "north arabian sea": { lat: 20.0, lon: 65.0 },
  "northeast arabian sea": { lat: 22.0, lon: 67.0 },
  "northwest arabian sea": { lat: 20.0, lon: 62.0 },
  "east central arabian sea": { lat: 15.0, lon: 67.0 },
  "southeast arabian sea": { lat: 10.0, lon: 73.0 },
  "southwest arabian sea": { lat: 10.0, lon: 62.0 },
  "lakshadweep sea": { lat: 11.0, lon: 73.5 },
  "bay of bengal": { lat: 15.0, lon: 87.0 },
  "north bay of bengal": { lat: 20.0, lon: 88.0 },
  "northwest bay of bengal": { lat: 19.0, lon: 85.0 },
  "northeast bay of bengal": { lat: 20.0, lon: 90.0 },
  "central bay of bengal": { lat: 15.0, lon: 87.0 },
  "west central bay of bengal": { lat: 15.0, lon: 84.0 },
  "east central bay of bengal": { lat: 15.0, lon: 89.0 },
  "south bay of bengal": { lat: 9.0, lon: 87.0 },
  "southwest bay of bengal": { lat: 9.0, lon: 83.0 },
  "andaman sea": { lat: 11.0, lon: 95.0 },
  "gulf of mannar": { lat: 9.0, lon: 79.0 },
  "palk strait": { lat: 10.0, lon: 79.5 },
  "comorin area": { lat: 7.5, lon: 77.5 },
  "kerala coast": { lat: 10.5, lon: 75.5 },
  "karnataka coast": { lat: 14.0, lon: 74.0 },
  "goa coast": { lat: 15.5, lon: 73.8 },
  "maharashtra coast": { lat: 18.5, lon: 72.5 },
  "gujarat coast": { lat: 22.5, lon: 70.5 },
  "tamil nadu coast": { lat: 11.0, lon: 79.5 },
  "andhra pradesh coast": { lat: 15.5, lon: 80.5 },
  "odisha coast": { lat: 20.5, lon: 86.5 },
  "west bengal coast": { lat: 21.5, lon: 88.0 },
};


function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


function extractWarningZones(html: string): Array<{
  zoneName: string;
  lat: number;
  lon: number;
  snippet: string;
}> {
  // Strip HTML tags to get plain text
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .toLowerCase();

  const found: Array<{
    zoneName: string;
    lat: number;
    lon: number;
    snippet: string;
  }> = [];

  for (const [zoneName, coords] of Object.entries(ZONE_CENTROIDS)) {
    if (text.includes(zoneName)) {
      const idx = text.indexOf(zoneName);
      const snippet = text
        .slice(Math.max(0, idx - 60), idx + zoneName.length + 120)
        .trim();
      found.push({ zoneName, ...coords, snippet });
    }
  }

  return found;
}

const parameters = z.object({
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .describe("Latitude of the fisher's current location"),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe("Longitude of the fisher's current location"),
  alertRadiusKm: z
    .number()
    .min(10)
    .max(1000)
    .optional()
    .describe(
      `Radius in km to consider 'nearby' (default: ${ALERT_RADIUS_KM})`,
    ),
});
type parametersType = z.infer<typeof parameters>;
const executeFn = async ({ latitude, longitude, alertRadiusKm = ALERT_RADIUS_KM }: parametersType) => {
    const timestamp = new Date().toISOString();

    // 1. Fetch the IMD marine forecast page
    let html: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(IMD_MARINE_URL, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; MarineHazardBot/1.0; +https://example.com)",
          Accept: "text/html",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`IMD responded with HTTP ${res.status}`);
      }
      html = await res.text();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        error: `Could not fetch IMD marine forecast page: ${message}`,
        alertActive: false,
        nearbyWarnings: [],
        allWarnedZones: [],
        dataTimestamp: timestamp,
        source: IMD_MARINE_URL,
      };
    }

    // 2. Extract all warning zones mentioned on the page
    const warnedZones = extractWarningZones(html);

    // 3. Compute distances and flag nearby zones
    const nearbyWarnings = warnedZones
      .map((zone) => ({
        ...zone,
        distanceKm: Math.round(
          haversineKm(latitude, longitude, zone.lat, zone.lon),
        ),
      }))
      .filter((z) => z.distanceKm <= alertRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const alertActive = nearbyWarnings.length > 0;

    return {
      alertActive,
      alertMessage: alertActive
        ? `WARNING: You are within ${alertRadiusKm} km of ${nearbyWarnings.length} active marine warning zone(s). Exercise extreme caution or avoid venturing into the sea.`
        : `No active IMD marine warnings found within ${alertRadiusKm} km of your location.`,
      nearbyWarnings: nearbyWarnings.map(
        ({ zoneName, lat, lon, distanceKm, snippet }) => ({
          zoneName,
          lat,
          lon,
          distanceKm,
          contextSnippet: snippet.slice(0, 200),
        }),
      ),
      allWarnedZonesCount: warnedZones.length,
      userLocation: { latitude, longitude },
      alertRadiusKm,
      dataTimestamp: timestamp,
      source: IMD_MARINE_URL,
    };
  }


export const hazardAlertTool = tool({
  name: "check_marine_hazard_alerts",
  description:
    "Scrapes the IMD (India Meteorological Department) marine forecast page to find active " +
    "sea warnings issued for fishermen. Checks whether the given lat/lon is within " +
    `${ALERT_RADIUS_KM} km of any warned zone and returns an alert if so.`,
  parameters,
  execute: executeFn
});
