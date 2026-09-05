import { Router } from "express";

import type { Request, Response } from "express";
import {
  generateRefreshToken,
  verifyRefreshToken,
} from "@repo/trpc/server/utils/jwt";
import { env } from "./env";
import logger from "@repo/logger/logger";
const authRouter = Router();



export default authRouter;
