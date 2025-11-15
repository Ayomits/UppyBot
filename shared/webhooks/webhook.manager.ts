import axios from "axios";
import { injectable } from "tsyringe";

import { sendWebhookNotification } from "#/queue/routes/webhooks/producers/index.js";

import type {
  WebhookBumpBanNotification,
  WebhookCommandSuccessNotification,
  WebhookNotification,
  WebhookRemindNotication,
} from "./webhook.types.js";
import { WebhookNotificationType } from "./webhook.types.js";

@injectable()
export class WebhookManager {
  static create() {
    return new WebhookManager();
  }

  createCommandExecutedPayload(
    guildId: string,
    payload: WebhookCommandSuccessNotification
  ) {
    return this.createPayload(
      guildId,
      WebhookNotificationType.CommandSuccess,
      payload
    );
  }

  createBumpBanPayload(
    guildId: string,
    type: number,
    payload: WebhookBumpBanNotification
  ) {
    return this.createPayload(guildId, type, payload);
  }

  createRemindPayload(guildId: string, payload: WebhookRemindNotication) {
    return this.createPayload(guildId, WebhookNotificationType.Remind, payload);
  }

  createForceRemindPayload(guildId: string, payload: WebhookRemindNotication) {
    return this.createPayload(
      guildId,
      WebhookNotificationType.ForceRemind,
      payload
    );
  }

  createTestNotificationPayload(guildId: string) {
    return this.createPayload(guildId, WebhookNotificationType.Test, {
      message: "this is a test notification",
    });
  }

  private createPayload<T>(
    guildId: string,
    type: number,
    payload: T
  ): WebhookNotification<T> {
    return {
      guildId,
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
    payload: WebhookNotification<T>
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
