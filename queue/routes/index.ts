import { registerLikeSyncConsumers } from "./like-sync/index.js";
import { registerRemindConsumers } from "./notifications/index.js";
import { registerTelegramNotifyConsumer } from "./telegram-notification/index.js";
import { registerWebhookConsumers } from "./webhooks/index.js";

export async function registerDiscordConsumers() {
  await registerRemindConsumers();
  await registerWebhookConsumers();
  await registerLikeSyncConsumers();
}

export async function registerTelegramConsumers() {
  await registerTelegramNotifyConsumer();
}
