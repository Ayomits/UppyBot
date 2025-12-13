import { likeSyncRoute } from "./like-sync/index.js";
import {
  telegramNotificationBumpBanRoute,
  telegramNotificationRemindRoute,
  telegramUserNotificationRoute,
} from "./telegram-notification/index.js";
import { themeSyncGlobal, themeSyncRoute } from "./theme-sync/index.js";
import { webhookRoute } from "./webhooks/index.js";

export async function registerDiscordConsumers() {
  await webhookRoute.register();
  await likeSyncRoute.register();
  await themeSyncRoute.register();
  await themeSyncGlobal.register();
}

export async function registerTelegramConsumers() {
  await telegramUserNotificationRoute.register();
  await telegramNotificationRemindRoute.register();
  await telegramNotificationBumpBanRoute.register();
}
