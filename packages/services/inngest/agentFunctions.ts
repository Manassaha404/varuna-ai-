import { inngest } from "./client";
import { runOrchestratorAgent } from "../agents/index.js";
import { publisher } from "@repo/redis/pubsub";
import {
  getChatMemory,
  appendChatMemory,
  formatMemoryForPrompt,
} from "../redis/chatMemory.js";

// ─── Fast script-based language detection (no API call) ───────────────────
// Detects Indian scripts by Unicode block ranges. Falls back to English.
// This is what actually gets injected into the orchestrator's prompt.

const SCRIPT_RANGES: Array<{ regex: RegExp; code: string; name: string }> = [
  { regex: /[\u0900-\u097F]/, code: "hi",  name: "Hindi"     }, // Devanagari
  { regex: /[\u0B80-\u0BFF]/, code: "ta",  name: "Tamil"     },
  { regex: /[\u0D00-\u0D7F]/, code: "ml",  name: "Malayalam" },
  { regex: /[\u0C00-\u0C7F]/, code: "te",  name: "Telugu"    },
  { regex: /[\u0C80-\u0CFF]/, code: "kn",  name: "Kannada"   },
  { regex: /[\u0A80-\u0AFF]/, code: "gu",  name: "Gujarati"  },
  { regex: /[\u0980-\u09FF]/, code: "bn",  name: "Bengali"   },
  { regex: /[\u0B00-\u0B7F]/, code: "or",  name: "Odia"      },
  { regex: /[\u0A00-\u0A7F]/, code: "pa",  name: "Punjabi"   },
];

/** Strip the location tag before script detection (same logic as the guardrail). */
function stripLocationTag(text: string): string {
  return text.replace(/\[User's current location:[^\]]*\]/gi, "").trim();
}

/**
 * Returns { code, name } for the dominant script in the text.
 * Pure unicode range check — zero latency, no API call.
 */
function detectLanguageFromText(text: string): { code: string; name: string } {
  const clean = stripLocationTag(text);
  for (const { regex, code, name } of SCRIPT_RANGES) {
    if (regex.test(clean)) return { code, name };
  }
  return { code: "en", name: "English" };
}


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

    // 3. Detect language from the raw query and build the enriched query.
    //    We inject a [Language directive] tag so the orchestrator reads the
    //    detected language directly in its prompt — the guardrail outputInfo
    //    is NOT automatically visible to the agent, so we must embed it here.
    const { code: langCode, name: langName } = detectLanguageFromText(query);
    const languageDirective = `[Language directive: Respond ONLY in ${langName} (${langCode}). ` +
      `Tool calls and internal reasoning in English only. ` +
      `The "summary" and "recommendations" fields MUST be in ${langName}.]`;

    const enrichedQuery = contextPrefix
      ? `${languageDirective}\n${contextPrefix}User: ${query}`
      : `${languageDirective}\n${query}`;


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
