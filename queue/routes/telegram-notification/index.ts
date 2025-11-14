import { QueueMessages } from "#/queue/const/index.js";
import { rabbitMq } from "#/shared/db/rabbitmq.js";

import { telegramNotificationConsumer } from "./consumers/index.js";

export async function registerTelegramNotifyConsumer() {
  const channel = await rabbitMq.createChannel();

  await channel.assertQueue(QueueMessages.telegram.notification, {
    durable: true,
    autoDelete: false,
  });

  await channel.consume(QueueMessages.telegram.notification, (msg) => {
    telegramNotificationConsumer(msg!, channel);
  });
}
