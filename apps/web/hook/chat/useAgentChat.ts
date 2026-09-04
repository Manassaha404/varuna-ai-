"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/trpc/client";
import socket from "@/lib/socket";

// ─── Message types ─────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface AgentEvidence {
  source: string;
  finding: string;
  dataTimestamp: string | null;
}

export interface AgentAlert {
  severity: "info" | "warning" | "severe";
  message: string;
}

export interface AgentResponse {
  summary: string;
  language: string;
  safetyVerdict: "safe" | "caution" | "unsafe" | "unknown" | null;
  recommendations: string[];
  evidence: AgentEvidence[];
  mapLayers: unknown[] | null;
  alerts: AgentAlert[] | null;
  queryLocation: {
    latitude: number;
    longitude: number;
    placeName: string | null;
  } | null;
  queryTimeHorizon: string | null;
}

export type AgentStreamPayload =
  | { type: "thinking"; runId: string }
  | { type: "result"; runId: string; data: AgentResponse }
  | { type: "error"; runId: string; message: string };

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  /** Populated only on assistant messages that completed successfully */
  agentData?: AgentResponse;
  /** Whether this message is still waiting for the agent response */
  isThinking?: boolean;
  /** Whether the agent returned an error */
  isError?: boolean;
}

// ─── Location types ────────────────────────────────────────────────────────

export type LocationStatus = "idle" | "resolving" | "granted" | "denied" | "unavailable";

interface UserLocation {
  latitude: number;
  longitude: number;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Namaste! I am VarunaAI, your marine safety assistant. Ask me about fishing conditions, weather, hazards, or tide data for any Indian coastal location.",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");

  // Cached geolocation — populated once on mount, reused for every message
  const locationRef = useRef<UserLocation | null>(null);

  // Track the current active runId so the socket listener can be scoped
  const activeRunIdRef = useRef<string | null>(null);

  const { mutateAsync: triggerAgentRun } = trpc.agent.run.useMutation();
  const { mutateAsync: clearMemory, isPending: isClearing } =
    trpc.agent.clearMemory.useMutation();

  // ─── Geolocation — eager, one-time fetch on mount ───────────────────────

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }

    setLocationStatus("resolving");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        locationRef.current = {
          latitude: parseFloat(coords.latitude.toFixed(4)),
          longitude: parseFloat(coords.longitude.toFixed(4)),
        };
        setLocationStatus("granted");
      },
      () => {
        // Permission denied or position unavailable — queries still work,
        // just without the location tag
        setLocationStatus("denied");
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 } // cache for 5 min
    );
  }, []);

  // ─── Socket listener ─────────────────────────────────────────────────────

  useEffect(() => {
    function handleAgentStream(payload: AgentStreamPayload) {
      const { runId } = payload;

      // Only process events for the currently active run
      if (runId !== activeRunIdRef.current) return;

      if (payload.type === "thinking") {
        // Already set to thinking in sendMessage; no-op here
        return;
      }

      if (payload.type === "result") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === `thinking-${runId}`
              ? {
                  ...msg,
                  id: `result-${runId}`,
                  isThinking: false,
                  text: payload.data.summary,
                  agentData: payload.data,
                }
              : msg
          )
        );
        setIsLoading(false);
        activeRunIdRef.current = null;
      }

      if (payload.type === "error") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === `thinking-${runId}`
              ? {
                  ...msg,
                  id: `error-${runId}`,
                  isThinking: false,
                  isError: true,
                  text: `Something went wrong: ${payload.message}`,
                }
              : msg
          )
        );
        setIsLoading(false);
        activeRunIdRef.current = null;
      }
    }

    socket.on("agent:stream", handleAgentStream);
    return () => {
      socket.off("agent:stream", handleAgentStream);
    };
  }, []);

  // ─── Send message ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (query: string) => {
      const text = query.trim();
      if (!text || isLoading) return;

      setApiError(null);
      setIsLoading(true);

      // Append user message
      const userMessageId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMessageId, role: "user", text },
      ]);

      try {
        // Append cached location as a compact tag for the agent.
        // The displayed message (text) stays clean — only the agent query is enriched.
        const loc = locationRef.current;
        const agentQuery = loc
          ? `${text}\n\n[User's current location: lat ${loc.latitude}, lon ${loc.longitude}]`
          : text;

        // Fire tRPC mutation → gets runId back
        const { runId } = await triggerAgentRun({ query: agentQuery });

        // Track current run
        activeRunIdRef.current = runId;

        // Join the socket room for this run
        socket.emit("join:room", { runId });

        // Add a thinking placeholder for the assistant
        setMessages((prev) => [
          ...prev,
          {
            id: `thinking-${runId}`,
            role: "assistant",
            text: "",
            isThinking: true,
          },
        ]);
      } catch (error: any) {
        setIsLoading(false);
        activeRunIdRef.current = null;
        const errMsg =
          error?.message ?? "Failed to connect to the agent. Please try again.";
        setApiError(errMsg);

        // Replace the loading message with an error if it was added
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            text: errMsg,
            isError: true,
          },
        ]);
      }
    },
    [isLoading, triggerAgentRun]
  );

  // ─── New chat ─────────────────────────────────────────────────────────────

  const newChat = useCallback(async () => {
    if (isLoading || isClearing) return;

    // Cancel any in-flight run
    activeRunIdRef.current = null;

    // Reset UI messages to just the welcome card
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: "Namaste! I am VarunaAI, your marine safety assistant. Ask me about fishing conditions, weather, hazards, or tide data for any Indian coastal location.",
      },
    ]);
    setApiError(null);

    // Wipe Redis short-term memory for this user (fire-and-forget on error)
    try {
      await clearMemory();
    } catch {
      // Non-critical — local state is already reset
    }
  }, [isLoading, isClearing, clearMemory]);

  return {
    messages,
    isLoading,
    isClearing,
    apiError,
    locationStatus,
    sendMessage,
    newChat,
    setApiError,
  };
}
