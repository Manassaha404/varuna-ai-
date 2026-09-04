import { Agent, run, InputGuardrail } from "@openai/agents";
import { z } from "zod";
export const CoordinateExtractionSchema = z.object({
  found: z.boolean().describe("Whether lat/lon coordinates were found in the query"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isWithinIndianEEZ: z.boolean().optional(),
  isValidOceanCoordinate: z.boolean().optional(),
  concern: z.string().optional().describe("Warning if coordinates seem problematic"),
});

const BOUNDS = {
  latMin: -15,  // Southern Indian Ocean
  latMax: 28,   // Northern limit of Indian EEZ
  lonMin: 55,   // Western Arabian Sea
  lonMax: 100,  // Eastern Bay of Bengal
};


const coordinateExtractorAgent = new Agent({
  name: "CoordinateExtractorAgent",
  model: "gpt-4o-mini",
  instructions: `Extract latitude and longitude coordinates from the user's query if present.

Look for:
- Explicit coordinates like "12.97N, 80.25E" or "lat 13, lon 80"
- Named places like "Chennai coast", "Mumbai harbour", "Puri beach" → estimate coordinates
- Relative descriptions like "near Rameswaram" → estimate from known geography

For Indian coastal places (common examples):
- Chennai/Madras coast: ~13.1°N, 80.3°E
- Mumbai/Bombay: ~19.0°N, 72.8°E  
- Kochi/Cochin: ~9.9°N, 76.3°E
- Visakhapatnam/Vizag: ~17.7°N, 83.3°E
- Tuticorin/Thoothukudi: ~8.8°N, 78.1°E
- Mangalore: ~12.9°N, 74.8°E
- Rameswaram: ~9.3°N, 79.3°E
- Puri, Odisha: ~19.8°N, 85.8°E
- Paradip: ~20.3°N, 86.6°E

Return found=false if no location can be determined.
If found, set isWithinIndianEEZ=true if the coordinates are within Indian ocean territory (roughly lat 0–25°N, lon 60–100°E).
Set isValidOceanCoordinate=true if the coordinate appears to be in an ocean/coastal area.`,
  outputType: CoordinateExtractionSchema,
});


let _lastExtractedCoords: { latitude: number; longitude: number } | null = null;

export function getLastExtractedCoordinates() {
  return _lastExtractedCoords;
}


export const coordinateValidationGuardrail: InputGuardrail = {
  name: "CoordinateValidationGuardrail",
  async execute({ input }) {
    const queryText =
      typeof input === "string"
        ? input
        : Array.isArray(input)
        ? input
            .map((m) => {
              if (typeof m === "string") return m;
              if (typeof m === "object" && m !== null && "content" in m) {
                const c = (m as any).content;
                if (Array.isArray(c)) {
                  return c.map((part: any) => part.text || "").join(" ");
                }
                return String(c);
              }
              return "";
            })
            .join("\n")
        : String(input);

    let result: z.infer<typeof CoordinateExtractionSchema>;
    try {
      const runResult = await run(coordinateExtractorAgent, queryText);
      result = runResult.finalOutput as z.infer<typeof CoordinateExtractionSchema>;
    } catch {
      // Fail open
      return {
        outputInfo: { found: false },
        tripwireTriggered: false,
      };
    }

    if (!result.found) {
      // No coordinates found — don't block, orchestrator will ask for location
      return { outputInfo: result, tripwireTriggered: false };
    }

    // Store for use by orchestrator
    if (result.latitude !== undefined && result.longitude !== undefined) {
      _lastExtractedCoords = {
        latitude: result.latitude,
        longitude: result.longitude,
      };
    }

    const { latitude, longitude } = result;

    // Hard reject: coordinates completely outside any valid range
    if (
      latitude !== undefined &&
      longitude !== undefined &&
      (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
    ) {
      return {
        outputInfo: {
          ...result,
          concern: `Invalid coordinates: lat=${latitude}, lon=${longitude}`,
        },
        tripwireTriggered: true,
      };
    }

    // Soft warn: outside Indian Ocean coverage area
    if (
      latitude !== undefined &&
      longitude !== undefined &&
      !result.isValidOceanCoordinate
    ) {
      console.warn(
        `[CoordinateValidationGuardrail] Coordinates (${latitude}, ${longitude}) may not be ocean/coastal.`
      );
      // Don't trip — just log the concern. Orchestrator will handle gracefully.
    }

    return {
      outputInfo: result,
      tripwireTriggered: false,
    };
  },
};
