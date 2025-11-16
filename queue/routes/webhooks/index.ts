import { QueueMessages } from "#/queue/const/index.js";
import { rabbitMq } from "#/shared/db/rabbitmq.js";
import { logger } from "#/shared/libs/logger/logger.js";

import { webhookCreatedConsumer } from "./consumers/index.js";

export async function registerWebhookConsumers() {
  const channel = await rabbitMq.createChannel();

  const queue = QueueMessages.webhooks.send;

  await channel.assertQueue(queue, {
    durable: true,
    autoDelete: false,
  });

  await channel.consume(queue, (msg) => {
    webhookCreatedConsumer(msg!, channel);
  });

  logger.log(`${queue} consumer successfully connected`);
}
