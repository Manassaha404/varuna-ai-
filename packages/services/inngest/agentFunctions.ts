import { inngest } from "./client";
import { runOrchestratorAgent } from "../agents/index.js";
import { publisher } from "@repo/redis/pubsub";
import {
  getChatMemory,
  appendChatMemory,
  formatMemoryForPrompt,
} from "../redis/chatMemory.js";

// ─── Event payload types ───────────────────────────────────────────────────

interface AgentRunEventData {
  /** Unique ID for this run — used as the Socket.IO room name */
  runId: string;
  /** The raw user query string */
  query: string;
  /** Optional userId for authenticated runs */
  userId?: string;
}

// ─── Stream payload types (mirrored on the client / socket server) ─────────

export type AgentStreamPayload =
  | { type: "thinking"; runId: string }
  | { type: "result"; runId: string; data: Awaited<ReturnType<typeof runOrchestratorAgent>> }
  | { type: "error"; runId: string; message: string };

// ─── Helper: publish to Redis → Socket server forwards to the client ────────

async function publishAgentStream(runId: string, payload: AgentStreamPayload) {
  await publisher.publish(`agent:stream:${runId}`, JSON.stringify(payload));
}

// ─── Inngest Function ──────────────────────────────────────────────────────

const agentRunFunction = inngest.createFunction(
  {
    id: "agent-run",
    triggers: {
      event: "agent/run.requested",
    },
  },
  async ({ event, step }) => {
    const { runId, query, userId } = event.data as AgentRunEventData;

    // 1. Notify client the agent has started
    await step.run("notify-thinking", async () => {
      await publishAgentStream(runId, { type: "thinking", runId });
    });

    // 2. Load short-term memory from Redis (scoped to the user when available)
    const contextPrefix = await step.run("load-chat-memory", async () => {
      if (!userId) return "";
      const turns = await getChatMemory(userId);
      return formatMemoryForPrompt(turns);
    });

    // 3. Build the enriched query — prepend prior conversation context so the
    //    orchestrator agent has awareness of what was already discussed.
    const enrichedQuery = contextPrefix
      ? `${contextPrefix}User: ${query}`
      : query;

    // 4. Run the orchestrator agent (retried automatically by Inngest on throw)
    const output = await step.run("run-orchestrator-agent", async () => {
      try {
        return await runOrchestratorAgent(enrichedQuery);
      } catch (error) {
        // Publish the error so the client is notified even on the first failure
        if (error instanceof Error) {
          await publishAgentStream(runId, {
            type: "error",
            runId,
            message: error.message,
          });
        }
        throw error; // re-throw so Inngest retries / marks the job failed
      }
    });

    // 5. Persist this turn to Redis memory so future runs have context
    await step.run("save-chat-memory", async () => {
      if (!userId) return;
      await appendChatMemory(userId, query, output.summary);
    });

    // 6. Publish the result back to the client
    await step.run("notify-result", async () => {
      await publishAgentStream(runId, { type: "result", runId, data: output });
    });

    return { runId, status: "completed" };
  },
);

const agentFunctions = [agentRunFunction];
export default agentFunctions;
