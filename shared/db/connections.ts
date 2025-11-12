import type mongoose from "mongoose";

import { logger } from "../libs/logger/logger.js";
import { createMongoDbConnection } from "./mongo.js";
import { createRabbitConnection } from "./rabbitmq.js";
import { createRedisConnection } from "./redis.js";

export async function createStoreConnection(options?: {
  mongo?: Partial<mongoose.ConnectOptions>;
}) {
  await createRedisConnection().then(() => logger.info("Redis connected"));
  await createMongoDbConnection(options?.mongo).then(() => logger.info("Mongodb connected"));
  await createRabbitConnection().then(() => logger.info("Rabbitmq connected"));
}
