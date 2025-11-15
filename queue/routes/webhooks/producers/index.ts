import { QueueMessages } from "#/queue/const/index.js";
import { publishMessage } from "#/queue/utils/publishMessage.js";

import type { WebhookCreatedPayload } from "../types.js";

export async function sendWebhookNotification<T>(data: WebhookCreatedPayload<T>) {
  return publishMessage(QueueMessages.webhooks.send, data);
}
