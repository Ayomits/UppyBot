import { QueueMessages } from "#/queue/const/index.js";
import { rabbitMq } from "#/shared/db/rabbitmq.js";

import {
  telegramRemindNotificationConsumer,
  telegramSingleNotificationConsumer,
} from "./consumers/index.js";

export async function registerTelegramNotifyConsumer() {
  const channel = await rabbitMq.createChannel();

  await channel.assertQueue(QueueMessages.telegram.notification, {
    durable: true,
    autoDelete: false,
  });

  await channel.consume(QueueMessages.telegram.notification, (msg) => {
    telegramSingleNotificationConsumer(msg!, channel);
  });
}

export async function registerTelegramNotificationRemindConsumer() {
  const channel = await rabbitMq.createChannel();

  await channel.assertQueue(QueueMessages.telegram.remind, {
    durable: true,
    autoDelete: false,
  });

  await channel.consume(QueueMessages.telegram.remind, (msg) => {
    telegramRemindNotificationConsumer(msg!, channel);
  });
}
