import mongoose from "mongoose";

import { Env } from "#/shared/libs/config/index.js";
import { logger } from "#/shared/libs/logger/index.js";

import { redisClient } from "./redis.js";

export const MongoDbNames = {
  Main: "Uppy",
  Notifications: "UppyNotifications",
};

export let mainMongoConnection: mongoose.Connection | null = null;
export let notificationMongoConnection: mongoose.Connection | null = null;
export let coreMongoConnection: mongoose.Connection | null = null;

export async function createMongoDbConnection(
  options?: mongoose.ConnectOptions,
): Promise<mongoose.Connection> {
  const mongooseInstance = await mongoose
    .createConnection(Env.MongoUrl, {
      autoCreate: false,
      autoIndex: true,
      ...options,
    })
    .asPromise();

  return mongooseInstance;
}

export async function createMainMongoConnection(): Promise<mongoose.Connection> {
  mainMongoConnection = await createMongoDbConnection({
    dbName: MongoDbNames.Main,
  });
  logger.success(`Connected to main mongo db`);

  return mainMongoConnection;
}

export async function createNotificationsMongoConnection(): Promise<mongoose.Connection> {
  notificationMongoConnection = await createMongoDbConnection({
    dbName: MongoDbNames.Notifications,
  });

  logger.success(`Connected to notifications mongo db`);

  return notificationMongoConnection;
}

export async function createCoreMongoConnection(): Promise<mongoose.Connection> {
  coreMongoConnection = await createMongoDbConnection({
    dbName: MongoDbNames.Notifications,
  });

  logger.success(`Connected to core mongo db`);

  return coreMongoConnection;
}

export async function useCachedQuery<T>(
  key: string,
  ttl: number,
  queryFn: () => Promise<T>,
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
  queryFn: () => Promise<T>,
) {
  await redisClient.del(key);
  return await useCachedQuery(key, ttl, queryFn);
}

export async function useCachedDelete<T>(
  key: string | string[],
  queryFn: () => Promise<T>,
) {
  await queryFn();
  await redisClient.del(key);
}
