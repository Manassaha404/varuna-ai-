import { Agent, run, InputGuardrail, InputGuardrailTripwireTriggered } from "@openai/agents";
import { z } from "zod";
export const TopicClassificationSchema = z.object({
  isMarineRelated: z
    .boolean()
    .describe("Whether the query is related to marine/maritime activities"),
  reason: z.string().describe("Brief explanation of the classification decision"),
});



const topicClassifierAgent = new Agent({
  name: "TopicClassifierAgent",
  model: "gpt-4o-mini",
  instructions: `You classify whether a user query is related to marine or maritime topics.
  
Marine/maritime topics include:
- Fishing, fish finding, PFZ (Potential Fishing Zones), fishing conditions
- Sea/ocean weather, wave height, sea state, sea surface temperature
- Tides, tidal currents, sea level
- Cyclones, storms, tsunamis affecting oceans or coasts
- Boat safety, vessel navigation, coastal routes
- Marine protected areas, fishing zones, sea restrictions
- Coastal geography, harbours, ports, beaches (in maritime context)
- INCOIS, Coast Guard, fisheries department queries

NOT marine topics:
- General land-based weather only (no ocean connection)
- Freshwater fishing in inland rivers/lakes (unless asking about sea routes)
- Stock market, finance, politics, entertainment, coding, etc.

Be lenient — if the query has any plausible marine connection, classify as marine-related.`,
  outputType: TopicClassificationSchema,
});


export const topicRelevanceGuardrail: InputGuardrail = {
  name: "TopicRelevanceGuardrail",
  async execute({ input }) {
    // Extract text from the input
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

    let result: z.infer<typeof TopicClassificationSchema>;
    try {
      const runResult = await run(topicClassifierAgent, queryText);
      result = runResult.finalOutput as z.infer<typeof TopicClassificationSchema>;
    } catch {
      // On classifier failure, allow through (fail open for availability)
      return { outputInfo: { isMarineRelated: true, reason: "Classifier unavailable — allowing through" }, tripwireTriggered: false };
    }

    const tripwireTriggered = !result.isMarineRelated;

    if (tripwireTriggered) {
      console.log(
        `[TopicRelevanceGuardrail] Query rejected as non-marine: ${result.reason}`
      );
    }

    return {
      outputInfo: result,
      tripwireTriggered,
    };
  },
};
