import type { ParseMode } from "grammy/types";

import type { WebhookRemindNotication } from "#/shared/webhooks/webhook.types.js";

export type TelegramSingleNotificationPayload = {
  telegram_id: number;
  content: string;
  parse_mode: ParseMode;
};

export type TelegramRemindNotificationsPayload = {
  guildId: string;
  users: string[];
  type: number;
  monitoring: number;
  original: Omit<WebhookRemindNotication, "aproximatedNotificationUsers">;
};

export type TelegramBumpBanNotificationPayload = {
  userId: string;
  guildId: string;
  type: number;
};
