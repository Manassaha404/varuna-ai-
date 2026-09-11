import { Redis } from "ioredis";

const createRedisConnection = () => {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL);
  }
  return new Redis({
      host: process.env.REDIS_HOST || "localhost",
    port: 6379,
    });
};

export const publisher = createRedisConnection();
export const subscriber = createRedisConnection();
