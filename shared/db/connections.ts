import { logger } from "../libs/logger/logger.js";
import { createMongoDbConnection } from "./mongo.js";
import { createRabbitConnection } from "./rabbitmq.js";
import { createRedisConnection } from "./redis.js";

export async function createStoreConnection() {
  await createRedisConnection().then(() => logger.info("Redis connected"));
  await createMongoDbConnection().then(() => logger.info("Mongodb connected"));
  await createRabbitConnection().then(() => logger.info("Rabbitmq connected"));
}
