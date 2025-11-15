import { QueueMessages } from "#/queue/const/index.js";
import { publishMessage } from "#/queue/utils/publishMessage.js";

import type { TelegramRemindNotificationsPayload, TelegramSingleNotificationPayload } from "../types.js";

export function telegramSingleNotificationProduce(payload: TelegramSingleNotificationPayload) {
  publishMessage(QueueMessages.telegram.notification, payload);
}

export function telegramRemindNotificationProduce(payload: TelegramRemindNotificationsPayload) {
  publishMessage(QueueMessages.telegram.remind, payload);
}
