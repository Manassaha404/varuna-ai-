import { tool } from "@openai/agents";
import { z } from "zod";
const WORLDTIDES_BASE = "https://www.worldtides.info/api/v3";
const TideInputSchema = z.object({
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .describe("Latitude of the tide query location"),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe("Longitude of the tide query location"),
  days: z
    .number()
    .int()
    .min(1)
    .max(7)
    .optional()
    .describe("Number of days of tide data to retrieve (default: 2)"),
});
type TideInputSchemaType = z.infer<typeof TideInputSchema>;
interface WorldTidesResponse {
  status?: number;
  error?: string;
  extremes?: Array<{
    type?: string;
    dt?: number;
    date?: string;
    height?: number;
  }>;
  requestLat?: number;
  requestLon?: number;
  responseLat?: number;
  responseLon?: number;
  atlas?: string;
  copyright?: string;
  callCount?: number;
}

const executeFn = async (input: TideInputSchemaType) => {
  const { latitude, longitude, days = 2 } = input;
  const timestamp = new Date().toISOString();
  const apiKey = "3fb41e5b-9ae3-4630-8d76-5650f58a1bbb";

  // No API key — return mock data with warning
  if (!apiKey) {
    console.warn(
      "[getTideExtremes] WORLDTIDES_API_KEY not set — returning mock tide data",
    );
    return {
      latitude,
      longitude,
      extremes: [],
      isMockData: true,
      error:
        "WORLDTIDES_API_KEY not configured. Tide data is synthesized and NOT reliable for navigation.",
      dataTimestamp: timestamp,
    };
  }

  // Build WorldTides v3 request
  const url = new URL(WORLDTIDES_BASE);
  url.searchParams.set("extremes", "");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("days", String(days));
  url.searchParams.set("key", apiKey);
  url.searchParams.set("datum", "LAT"); // Lowest Astronomical Tide

  let data: WorldTidesResponse;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`WorldTides responded with HTTP ${res.status}`);
    }
    data = (await res.json()) as WorldTidesResponse;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[getTideExtremes] Fetch failed: ${message}`);
    return {
      latitude,
      longitude,
      extremes: [],
      isMockData: true,
      error: `WorldTides API unavailable: ${message}. Returning synthesized data.`,
      dataTimestamp: timestamp,
    };
  }

  if (data.status && data.status !== 200) {
    return {
      latitude,
      longitude,
      extremes: [],
      error: `WorldTides error: ${data.error ?? data.status}`,
      dataTimestamp: timestamp,
    };
  }

  // Normalize extremes
  const extremes = (data.extremes ?? []).map((e) => ({
    type: e.type === "High" || e.type === "Low" ? e.type : "High",
    dt: e.date ?? (e.dt ? new Date(e.dt * 1000).toISOString() : timestamp),
    height: e.height ?? 0,
  }));

  return {
    latitude,
    longitude,
    extremes,
    isMockData: false,
    dataTimestamp: timestamp,
  };
};
export const getTideExtremesTool = tool({
  name: "getTideExtremes",
  description:
    "Fetches tide extremes (high tide and low tide times and heights) for a given " +
    "coastal or oceanic location. Returns the next 2–7 days of high/low tide events " +
    "with timestamps and heights in metres.",
  parameters: TideInputSchema,
  execute: executeFn,
});
