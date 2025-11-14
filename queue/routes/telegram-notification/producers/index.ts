import { QueueMessages } from "#/queue/const/index.js";
import { publishMessage } from "#/queue/utils/publishMessage.js";

import type { TelegramNotifyPayload } from "../types.js";

export function telegramNotificationProduce(payload: TelegramNotifyPayload) {
  publishMessage(QueueMessages.telegram.notification, payload);
}
