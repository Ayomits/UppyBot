import { WebhookManager } from "#/app/controllers/webhooks/webhook.manager.js";
import { logger } from "#/libs/logger/logger.js";
import type { Consumer } from "#/queue/utils/types.js";

import type { WebhookCreatedPayload } from "../types.js";

export const webhookCreatedConsumer: Consumer = async (msg, ch) => {
  try {
    const data = JSON.parse(
      msg.content.toString()
    ) as WebhookCreatedPayload<object>;

    const webhookManager = WebhookManager.create();
    await webhookManager
      .sendNotification(data.url, data.token, data.data)
      .then(
        (v) => v && logger.info(`Webhook sended to ${data.url}`) && ch.ack(msg)
      )
      .catch(() => ch.nack(msg, false, false));
  } catch {
    ch.nack(msg, false, false);
  }
};
