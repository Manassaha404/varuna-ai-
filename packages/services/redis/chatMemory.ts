import redis from "@repo/redis/index";

// ─── Config ──────────────────────────────────────────────────────────────────

/** Maximum number of turns (user + assistant pairs) to keep per user. */
const MAX_TURNS = 10;

/** TTL for the memory key — resets on every write (2 hours). */
const TTL_SECONDS = 60 * 60 * 2;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MemoryTurn {
  role: "user" | "assistant";
  content: string;
}

// ─── Key helper ──────────────────────────────────────────────────────────────

const memoryKey = (userId: string) => `chat:memory:${userId}`;

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Returns the stored conversation turns for a user, oldest first.
 * Returns an empty array if no history exists yet.
 */
export async function getChatMemory(userId: string): Promise<MemoryTurn[]> {
  const raw = await redis.lrange(memoryKey(userId), 0, -1);
  return raw.map((item) => JSON.parse(item) as MemoryTurn);
}

// ─── Write ───────────────────────────────────────────────────────────────────

/**
 * Appends a user turn and an assistant turn to the user's memory.
 * Trims the list to the last MAX_TURNS * 2 entries and refreshes the TTL.
 */
export async function appendChatMemory(
  userId: string,
  userMessage: string,
  assistantSummary: string
): Promise<void> {
  const key = memoryKey(userId);

  const userTurn: MemoryTurn = { role: "user", content: userMessage };
  const assistantTurn: MemoryTurn = { role: "assistant", content: assistantSummary };

  // Push both turns atomically then trim + refresh TTL
  await redis
    .multi()
    .rpush(key, JSON.stringify(userTurn), JSON.stringify(assistantTurn))
    // Keep only the most recent MAX_TURNS * 2 entries (each turn = 2 items)
    .ltrim(key, -(MAX_TURNS * 2), -1)
    .expire(key, TTL_SECONDS)
    .exec();
}

// ─── Clear ───────────────────────────────────────────────────────────────────

/** Clears all memory for a user (e.g. on explicit "reset" action). */
export async function clearChatMemory(userId: string): Promise<void> {
  await redis.del(memoryKey(userId));
}

// ─── Format for prompt ───────────────────────────────────────────────────────

/**
 * Converts stored memory turns into a compact conversation block
 * suitable for prepending to an agent system prompt.
 *
 * Example output:
 *   [Previous conversation context]
 *   User: Is it safe to fish near Kochi?
 *   Assistant: Conditions are moderate — wave height 1.2 m, no active hazards.
 *   ---
 */
export function formatMemoryForPrompt(turns: MemoryTurn[]): string {
  if (turns.length === 0) return "";

  const lines = turns.map(
    (t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`
  );

  return [
    "[Previous conversation context]",
    ...lines,
    "---",
    "",
  ].join("\n");
}
