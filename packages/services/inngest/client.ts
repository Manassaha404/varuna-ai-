import { Inngest } from "inngest";
import { env } from "../env";

export const inngest = new Inngest({
  id: "VarunaAI",
  // In production (self-hosted) these point the SDK at our own Inngest server.
  // In local dev they are undefined and the SDK falls back to INNGEST_DEV mode.
  ...(env.INNGEST_BASE_URL ? { baseUrl: env.INNGEST_BASE_URL } : {}),
  ...(env.INNGEST_SIGNING_KEY ? { signingKey: env.INNGEST_SIGNING_KEY } : {}),
  ...(env.INNGEST_EVENT_KEY ? { eventKey: env.INNGEST_EVENT_KEY } : {}),
});
