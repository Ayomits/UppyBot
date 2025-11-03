import type { RedisOptions } from "ioredis";
import { Redis } from "ioredis";

import { Env } from "#/libs/config/index.js";
import { logger } from "#/libs/logger/logger.js";

function createRedis() {
  const options: RedisOptions = {
    host: Env.RedisHost,
    port: Env.RedisPort,
    lazyConnect: true,
  };

  if (Env.RedisPassword) {
    options.username = Env.RedisUsername;
  }

  if (Env.RedisPassword) {
    options.password = Env.RedisPassword;
  }

  return new Redis(options);
}

const redis = createRedis();

class RedisClient {
  static create() {
    return new RedisClient();
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) {
      logger.info("CACHE MISS:", key);
      return null;
    }
    logger.info("CACHE HIT:", key);
    return JSON.parse(value) as T;
  }

  async setJson<T>(key: string, value: T, ttl: number) {
    return await redis
      .set(key, JSON.stringify(value), "EX", ttl)
      .then(() => logger.info("CACHE SET:", key));
  }

  async del(key: string | string[]) {
    const keys = Array.isArray(key) ? key : [key];

    if (keys.length === 0) {
      return 0;
    }

    return await redis
      .del(...keys)
      .then(() => logger.info(`Deleted next keys: ${keys.join(", ")}`));
  }

  async delByPattern(pattern: string) {
    if (pattern === "*" || pattern === "") {
      throw new Error(
        "Dangerous pattern detected. Use explicit method for full cleanup."
      );
    }

    const MAX_KEYS_TO_DELETE = 10000;
    let totalDeleted = 0;
    let cursor = "0";

    do {
      const [newCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = newCursor;

      if (keys.length > 0) {
        const deleted = await redis.del(...keys);
        totalDeleted += deleted;
        if (totalDeleted >= MAX_KEYS_TO_DELETE) {
          break;
        }
      }
    } while (cursor !== "0");

    logger.info(`DELETED BY PATTERN ${pattern}: ${totalDeleted} keys`);

    return totalDeleted;
  }

  async exists(key: string) {
    return await redis.exists(key);
  }

  async expire(key: string, ttl: number) {
    return await redis.expire(key, ttl);
  }

  async ttl(key: string) {
    return await redis.ttl(key);
  }
}

export const redisClient = RedisClient.create();

export async function createRedisConnection() {
  await redis.connect();
}
