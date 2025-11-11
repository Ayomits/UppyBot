import { QueueMessages } from "#/queue/const/index.js";
import { rabbitMq } from "#/shared/db/rabbitmq.js";

import { webhookCreatedConsumer } from "./consumers/index.js";

export async function registerWebhookConsumers() {
  const channel = await rabbitMq.createChannel();

  await channel.assertQueue(QueueMessages.webhooks.send, {
    durable: true,
    autoDelete: false,
  });

  await channel.consume(QueueMessages.webhooks.send, (msg) => {
    webhookCreatedConsumer(msg!, channel);
  });
}
