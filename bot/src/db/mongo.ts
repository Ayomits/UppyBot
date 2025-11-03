import mongoose from "mongoose";
import cache from "ts-cache-mongoose";

import { Env } from "#/libs/config/index.js";
import { logger } from "#/libs/logger/logger.js";

export const redisCache = cache.init(mongoose, {
  defaultTTL: "60 seconds",
  engine: "redis",
  engineOptions: {
    host: Env.RedisHost,
    port: Env.RedisPort,
  },
  debug: Env.AppEnv === "dev",
});

export async function createDb() {
  await mongoose
    .connect(Env.MongoUrl, {
      autoCreate: true,
    })
    .catch(logger.error)
    .then(() => logger.success("succesfully connected to mongodb"));
}
