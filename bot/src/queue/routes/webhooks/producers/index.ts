import { QueueMessages } from "#/queue/const/index.js";
import { publishMessage } from "#/queue/utils/publishMessage.js";

import type { WebhookCreatedPayload } from "../types.js";

export function sendWebhookNotification<T>(data: WebhookCreatedPayload<T>) {
  publishMessage(QueueMessages.webhooks.send, data);
}
