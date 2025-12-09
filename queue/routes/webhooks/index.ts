import { QueueMessages } from "#/queue/const/index.js";
import { createRoute } from "#/queue/utils/create-route.js";
import { parseConsumerData } from "#/queue/utils/parse-data.js";
import { WebhookManager } from "#/shared/webhooks/webhook.manager.js";

import type { WebhookCreatedPayload } from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const webhookRoute = createRoute<WebhookCreatedPayload<any>>({
  queue: QueueMessages.webhooks.send,
  async consumeCallback(msg) {
    const data = parseConsumerData<WebhookCreatedPayload<object>>(msg);

    const webhookManager = WebhookManager.create();
    await webhookManager.sendNotification(data.url, data.token, data.data);
  },
});
