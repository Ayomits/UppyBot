import type { Consumer } from "#/queue/utils/types.js";
import { logger } from "#/shared/libs/logger/logger.js";
import { WebhookManager } from "#/shared/webhooks/webhook.manager.js";

import type { WebhookCreatedPayload } from "../types.js";

export const webhookCreatedConsumer: Consumer = async (msg, ch) => {
  try {
    const data = JSON.parse(
      msg.content.toString()
    ) as WebhookCreatedPayload<object>;

    const webhookManager = WebhookManager.create();
    await webhookManager.sendNotification(data.url, data.token, data.data);

    logger.log(`Webhook sended to url: ${data.url}`);
    ch.ack(msg);
  } catch {
    ch.nack(msg, false, false);
  }
};
