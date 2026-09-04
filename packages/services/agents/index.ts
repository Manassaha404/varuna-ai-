import { run } from "@openai/agents";
import MarineOrchestratorAgent from "./agent-clients/orchestratorAgent.js";
import type { z } from "zod";
import type { MarineResponseSchema } from "./schemas/outputSchema.js";

export type MarineResponse = z.infer<typeof MarineResponseSchema>;

export interface AgentRunResult {
  runId: string;
  output: MarineResponse;
}

/**
 * Runs the MarineOrchestratorAgent with the given user query.
 * Returns the fully structured MarineResponse output.
 */
export async function runOrchestratorAgent(
  query: string
): Promise<MarineResponse> {
  const result = await run(MarineOrchestratorAgent, query);

  if (!result.finalOutput) {
    throw new Error("Agent returned no output");
  }

  return result.finalOutput as MarineResponse;
}
