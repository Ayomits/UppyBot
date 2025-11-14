import { QueueMessages } from "#/queue/const/index.js";
import { rabbitMq } from "#/shared/db/rabbitmq.js";

import { likeSyncConsumer } from "./consumers/index.js";

export async function registerLikeSyncConsumers() {
  const channel = await rabbitMq.createChannel();

  await channel.assertQueue(QueueMessages.like.sync, {
    durable: true,
    autoDelete: false,
  });

  await channel.consume(QueueMessages.like.sync, (msg) =>
    likeSyncConsumer(msg!, channel),
  );
}
