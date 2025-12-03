import { logger } from "../libs/logger/index.js";
import { createRabbitConnection } from "./rabbitmq.js";
import { createRedisConnection } from "./redis.js";

export async function createStoreConnection() {
  await createRedisConnection().then(() => logger.info("Redis connected"));
  await createRabbitConnection().then(() => logger.info("Rabbitmq connected"));
}
