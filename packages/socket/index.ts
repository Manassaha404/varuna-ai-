import { Server } from "socket.io";
import { env } from "./env";
import { subscriber } from "@repo/redis/pubsub";

const io = new Server({
  cors: {
    origin: [env.CLIENT_URL, env.API_BASE_URL],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ─── Socket.IO connection handler ─────────────────────────────────────────

io.on("connection", (socket) => {
  /**
   * Client emits { runId } after receiving it from the tRPC mutation.
   * We join the socket into that room so it receives agent:stream events.
   */
  socket.on("join:room", ({ runId }: { runId: string }) => {
    if (typeof runId === "string" && runId.length > 0) {
      socket.join(runId);
    }
  });

  socket.on("disconnect", () => {
    // rooms are cleaned up automatically by socket.io
  });
});

// ─── Redis subscriber → forward to Socket.IO room ─────────────────────────

/**
 * Subscribe to patterned channels: agent:stream:<runId>
 * When Inngest publishes to one of these, we forward the payload
 * to the matching Socket.IO room.
 */
subscriber.psubscribe("agent:stream:*", (err) => {
  if (err) {
    console.error("[socket] Failed to psubscribe to agent:stream:*", err);
  }
});

subscriber.on("pmessage", (_pattern, channel, message) => {
  // channel = "agent:stream:<runId>"
  const runId = channel.replace("agent:stream:", "");
  try {
    const payload = JSON.parse(message);
    io.to(runId).emit("agent:stream", payload);
  } catch (e) {
    console.error("[socket] Failed to parse message from Redis", e);
  }
});

// ─── Attach to HTTP server ─────────────────────────────────────────────────

const attachSocketServer = (httpServer: any) => {
  io.attach(httpServer);
};

export { io, attachSocketServer };
