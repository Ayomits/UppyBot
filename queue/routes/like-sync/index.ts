import { QueueMessages } from "#/queue/const/index.js";
import { rabbitMq } from "#/shared/db/rabbitmq.js";
import { logger } from "#/shared/libs/logger/logger.js";

import { likeSyncConsumer } from "./consumers/index.js";

export async function registerLikeSyncConsumers() {
  const channel = await rabbitMq.createChannel();

  const queue = QueueMessages.like.sync;

  await channel.assertQueue(queue, {
    durable: true,
    autoDelete: false,
  });

  await channel.consume(queue, (msg) => likeSyncConsumer(msg!, channel));

  logger.info(`${queue} consumer successfully connected`);
}
