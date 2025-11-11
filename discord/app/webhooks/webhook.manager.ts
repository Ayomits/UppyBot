import axios from "axios";
import { injectable } from "tsyringe";

import { sendWebhookNotification } from "#/queue/routes/webhooks/producers/index.js";

import type {
  WebhookBumpBanNotification,
  WebhookCommandSuccessNotification,
  WebhookNotification,
} from "./webhook.types.js";
import { WebhookNotificationType } from "./webhook.types.js";

@injectable()
export class WebhookManager {
  static create() {
    return new WebhookManager();
  }

  createCommandExecutedPayload(payload: WebhookCommandSuccessNotification) {
    return this.createPayload(WebhookNotificationType.CommandSuccess, payload);
  }

  createBumpBanPayload(
    type:
      | typeof WebhookNotificationType.BumpBanCreation
      | typeof WebhookNotificationType.BumpBanRemoval,
    payload: WebhookBumpBanNotification,
  ) {
    return this.createPayload(type, payload);
  }

  createTestRemindPayload() {
    return this.createPayload(WebhookNotificationType.Test, {
      message: "this is a test notification",
    });
  }

  private createPayload<T>(
    type: WebhookNotificationType,
    payload: T,
  ): WebhookNotification<T> {
    return {
      type,
      data: payload,
    };
  }

  pushConsumer<T>(url: string, token: string, data: WebhookNotification<T>) {
    sendWebhookNotification({
      url,
      token,
      data,
    });
  }

  async sendNotification<T>(
    url: string,
    token: string,
    payload: WebhookNotification<T>,
  ) {
    return await axios
      .post(url, payload, {
        timeout: 4_000,
        params: {
          token,
        },
      })
      .catch(() => null);
  }
}
