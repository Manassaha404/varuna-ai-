import { tool } from "@openai/agents";
import { z } from "zod";
import { max } from "../utils/max";
import { avg } from "../utils/avg";
const MARINE_API_BASE = "https://marine-api.open-meteo.com/v1/marine";
const ROUGH_SEA_WAVE_HEIGHT_M = 2.0;
const parameters = z.object({
  latitude: z
    .number()
    .describe("Latitude of the location in decimal degrees (e.g. 19.07)"),
  longitude: z
    .number()
    .describe("Longitude of the location in decimal degrees (e.g. 72.87)"),
  forecastDays: z
    .number()
    .int()
    .min(1)
    .max(7)
    .default(1)
    .describe("Number of forecast days to retrieve (1–7, default: 1)"),
});

type parametersType = z.infer<typeof parameters>;

const executeFn = async ({
  latitude,
  longitude,
  forecastDays,
}: parametersType) => {
  const url = new URL(MARINE_API_BASE);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "hourly",
    "wave_height,sea_surface_temperature,wind_wave_height",
  );
  url.searchParams.set("forecast_days", String(forecastDays));

  let data: any;
  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    data = await response.json();
  } catch (err: any) {
    return { error: `Failed to fetch marine forecast: ${err.message}` };
  }

  const hourly = data?.hourly;
  if (!hourly) {
    return { error: "Unexpected API response: missing hourly data." };
  }

  const times: string[] = hourly.time ?? [];
  const waveHeights: (number | null)[] = hourly.wave_height ?? [];
  const sst: (number | null)[] = hourly.sea_surface_temperature ?? [];
  const windWaveHeights: (number | null)[] = hourly.wind_wave_height ?? [];

  // Build per-hour records
  const hourlyRecords = times.map((time, i) => ({
    time,
    waveHeightM: waveHeights[i] ?? null,
    sstC: sst[i] ?? null,
    windWaveHeightM: windWaveHeights[i] ?? null,
  }));

  // Summary stats
  const maxWaveHeightM = max(waveHeights);
  const avgWaveHeightM = avg(waveHeights);
  const maxWindWaveHeightM = max(windWaveHeights);
  const avgSstC = avg(sst);

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    forecastDays,
    hourly: hourlyRecords,
    summary: {
      maxWaveHeightM,
      avgWaveHeightM,
      maxWindWaveHeightM,
      avgSstC,
      dangerousWaveThresholdExceeded:
        maxWaveHeightM !== undefined &&
        maxWaveHeightM > ROUGH_SEA_WAVE_HEIGHT_M,
    },
    dataTimestamp: data.generationtime_ms
      ? new Date().toISOString()
      : undefined,
  };
};

export const marineForecastTool = tool({
  name: "get_marine_forecast",
  description:
    "Fetches hourly marine weather forecast (wave height, sea surface temperature, wind wave height) for a given location and number of forecast days using the Open-Meteo Marine API.",
  parameters,
  execute: executeFn,
});
