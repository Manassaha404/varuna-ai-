import { serve } from "inngest/express";
import { inngest } from "./client";
import agentFunctions from "./agentFunctions";

export const inngestRouter = serve({
  client: inngest,
  functions: [...agentFunctions],
  serveOrigin: "http://localhost:8000",
});

export { inngest };
