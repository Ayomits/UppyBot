import { likeSyncRoute } from "./like-sync/index.js";
import {
  telegramNotificationBumpBanRoute,
  telegramNotificationRemindRoute,
  telegramUserNotificationRoute,
} from "./telegram-notification/index.js";
import { webhookRoute } from "./webhooks/index.js";

export async function registerDiscordConsumers() {
  await webhookRoute.register();
  await likeSyncRoute.register();
}

export async function registerTelegramConsumers() {
  await telegramUserNotificationRoute.register();
  await telegramNotificationRemindRoute.register();
  await telegramNotificationBumpBanRoute.register();
}
