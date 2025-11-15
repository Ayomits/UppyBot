import { registerLikeSyncConsumers } from "./like-sync/index.js";
import {
  registerTelegramNotificationBumpBanConsumer,
  registerTelegramNotificationRemindConsumer,
  registerTelegramNotifyConsumer,
} from "./telegram-notification/index.js";
import { registerWebhookConsumers } from "./webhooks/index.js";

export async function registerDiscordConsumers() {
  await registerWebhookConsumers();
  await registerLikeSyncConsumers();
}

export async function registerTelegramConsumers() {
  await registerTelegramNotifyConsumer();
  await registerTelegramNotificationRemindConsumer();
  await registerTelegramNotificationBumpBanConsumer();
}
