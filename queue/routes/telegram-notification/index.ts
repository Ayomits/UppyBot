import { QueueMessages } from "#/queue/const/index.js";
import { rabbitMq } from "#/shared/db/rabbitmq.js";
import { logger } from "#/shared/libs/logger/logger.js";

import {
  telegramBumpBanNotificationConsumer,
  telegramRemindNotificationConsumer,
  telegramSingleNotificationConsumer,
} from "./consumers/index.js";

export async function registerTelegramNotifyConsumer() {
  const channel = await rabbitMq.createChannel();

  const queue = QueueMessages.telegram.notification;

  await channel.assertQueue(queue, {
    durable: true,
    autoDelete: false,
  });

  await channel.consume(queue, (msg) => {
    telegramSingleNotificationConsumer(msg!, channel);
  });

  logger.log(`${queue} consumer successfully connected`);
}

export async function registerTelegramNotificationRemindConsumer() {
  const channel = await rabbitMq.createChannel();

  const queue = QueueMessages.telegram.remind;

  await channel.assertQueue(queue, {
    durable: true,
    autoDelete: false,
  });

  await channel.consume(queue, (msg) => {
    telegramRemindNotificationConsumer(msg!, channel);
  });

  logger.log(`${queue} consumer successfully connected`);
}

export async function registerTelegramNotificationBumpBanConsumer() {
  const channel = await rabbitMq.createChannel();

  const queue = QueueMessages.telegram.bumpBan;

  await channel.assertQueue(queue, {
    durable: true,
    autoDelete: false,
  });

  await channel.consume(queue, (msg) => {
    telegramBumpBanNotificationConsumer(msg!, channel);
  });

  logger.log(`${queue} consumer successfully connected`);
}
