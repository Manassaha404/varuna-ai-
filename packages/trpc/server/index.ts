import "dotenv/config";
import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { agentRouter } from "./routes/agent/route";
import { uploadRouter } from "./routes/upload/route";
import { router } from "./trpc";


export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  agent: agentRouter,
  upload: uploadRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
