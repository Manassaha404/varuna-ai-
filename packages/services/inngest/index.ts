import { serve } from "inngest/express";
import { inngest } from "./client";
import agentFunctions from "./agentFunctions";

export const inngestRouter = serve({
  client: inngest,
  functions: [...agentFunctions],
  serveOrigin: process.env.INNGEST_SERVE_ORIGIN ?? "http://localhost:8000",
});

export { inngest };
