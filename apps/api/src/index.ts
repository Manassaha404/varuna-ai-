import "dotenv/config";
import http from "node:http";
import logger from "@repo/logger/logger";
import { app as expressApplication } from "./server";
import { env } from "./env";
import "@repo/services/email/emailWorker";

async function syncWithInngest() {
  // PUT to our own serve endpoint — the SDK handler pushes functions to the Inngest server
  const origin = process.env.INNGEST_SERVE_ORIGIN ?? "http://localhost:8000";
  try {
    const res = await fetch(`${origin}/api/inngest`, { method: "PUT" });
    if (res.ok) {
      logger.info("Inngest sync completed successfully");
    } else {
      const body = await res.text();
      logger.warn(`Inngest sync returned ${res.status}: ${body}`);
    }
  } catch (err) {
    logger.warn("Inngest sync failed — will retry on next restart", { err });
  }
}

async function init() {
  try {
    const server = http.createServer(expressApplication);

    const PORT: number = env.PORT ? +env.PORT : 8000;
    server.listen(PORT, () => {
      logger.info(`http server is running on PORT ${PORT}`);
      // Give inngest dev server a moment to finish starting before we push sync
      setTimeout(syncWithInngest, 5000);
    });
  } catch (err) {
    logger.error(`Error creating http server`, { err });
    process.exit(1);
  }
}
init();
