import { QueueMessages } from "#/queue/const/index.js";
import { publishMessage } from "#/queue/utils/publishMessage.js";

import type {
  TelegramBumpBanNotificationPayload,
  TelegramRemindNotificationsPayload,
  TelegramSingleNotificationPayload,
} from "../types.js";

export async function telegramSingleNotificationProduce(
  payload: TelegramSingleNotificationPayload
) {
  return publishMessage(QueueMessages.telegram.notification, payload);
}

export async function telegramRemindNotificationProduce(
  payload: TelegramRemindNotificationsPayload
) {
  return publishMessage(QueueMessages.telegram.remind, payload);
}

export async function telegramBumpBanNotificationProduce(
  payload: TelegramBumpBanNotificationPayload
) {
  return publishMessage(QueueMessages.telegram.bumpBan, payload);
}
