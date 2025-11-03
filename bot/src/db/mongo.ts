import mongoose from "mongoose";

import { Env } from "#/libs/config/index.js";
import { logger } from "#/libs/logger/logger.js";

import { redisClient } from "./redis.js";

export async function createDb() {
  await mongoose
    .connect(Env.MongoUrl, {
      autoCreate: true,
    })
    .catch(logger.error);
}

export async function useCachedQuery<T>(
  key: string,
  ttl: number,
  queryFn: () => Promise<T>
) {
  const cached = await redisClient.getJson<T>(key);
  if (cached) {
    return cached;
  }
  const value = await queryFn();
  if (value) {
    await redisClient.setJson(key, value, ttl);
  }
  return value;
}

export async function useCachedUpdate<T>(
  key: string,
  ttl: number,
  queryFn: () => Promise<T>
) {
  await redisClient.del(key);
  return await useCachedQuery(key, ttl, queryFn);
}

export async function useCachedDelete<T>(
  key: string | string[],
  queryFn: () => Promise<T>
) {
  await queryFn();
  await redisClient.del(key);
}
