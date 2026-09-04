import z from "zod";

export const EvidenceSchema = z.object({
  source: z.string().describe("Name of the data source (e.g. 'INCOIS PFZ', 'Open-Meteo', 'GDACS')"),
  finding: z.string().describe("Human-readable description of what was found"),
  // OpenAI structured outputs: all fields must be required — use nullable() not optional()
  dataTimestamp: z
    .string()
    .nullable()
    .describe("ISO-8601 timestamp of the data, or null if unavailable"),
});
export const MapLayerSchema = z.object({
  type: z
    .enum(["pfz", "hazard", "tide", "geofence", "route"])
    .describe("Category of the geospatial layer"),
  geojson: z
    .string()
    .describe("Stringified GeoJSON FeatureCollection or Feature object for client-side rendering"),
});
export const AlertSchema = z.object({
  severity: z.enum(["info", "warning", "severe"]).describe("Alert severity level"),
  message: z.string().describe("Alert message for display to the user"),
});
export const SafetyVerdictSchema = z.enum(["safe", "caution", "unsafe", "unknown"]);
export const MarineResponseSchema = z.object({
  summary: z
    .string()
    .describe("A natural-language answer to the user's query, in the detected language"),

  language: z
    .string()
    .describe("BCP-47 language code of the response (e.g. 'en', 'ta', 'hi', 'ml')"),

  safetyVerdict: SafetyVerdictSchema
    .nullable()
    .describe(
      "Overall safety assessment: safe | caution | unsafe | unknown | null. " +
      "Null only when query is purely informational with no safety dimension."
    ),

  recommendations: z
    .array(z.string())
    .describe(
      "Actionable, evidence-backed recommendations. Every item must trace to at least one evidence entry."
    ),

  evidence: z
    .array(EvidenceSchema)
    .describe("Evidence from data sources supporting the summary and recommendations"),

  mapLayers: z
    .array(MapLayerSchema)
    .nullable()
    .describe("GeoJSON layers for client-side map rendering, or null if none"),

  alerts: z
    .array(AlertSchema)
    .nullable()
    .describe("Active alerts to surface prominently in the UI, or null if none"),

  queryLocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      placeName: z.string().nullable(),
    })
    .nullable()
    .describe("The resolved coordinates used for data lookups, or null if not determinable"),

  queryTimeHorizon: z
    .string()
    .nullable()
    .describe("Human-readable time window (e.g. 'next 24 hours'), or null"),
});