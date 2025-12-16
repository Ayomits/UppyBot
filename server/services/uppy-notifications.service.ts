import type { FastifyReply, FastifyRequest } from "fastify";

import {
  telegramNotificationBumpBanRoute,
  telegramNotificationRemindRoute,
} from "#/queue/routes/telegram-notification/index.js";
import { Env } from "#/shared/libs/config/index.js";
import type {
  WebhookBumpBanNotification,
  WebhookRemindNotication,
} from "#/shared/webhooks/webhook.types.js";
import {
  type WebhookNotification,
  WebhookNotificationType,
} from "#/shared/webhooks/webhook.types.js";

import { HTTPStatus } from "../const/status.js";

export class UppyNotificationService {
  static create() {
    return new UppyNotificationService();
  }

  async handleNotificationWebhook(req: FastifyRequest, reply: FastifyReply) {
    const data = req.body as WebhookNotification<unknown>;

    if (req.query?.["token"] !== Env.UppyInternalToken) {
      return reply.code(HTTPStatus.Forbidden).send({
        message: "Invalid code",
      });
    }

    if (data.type === WebhookNotificationType.Test) {
      return reply.send("OK");
    }

    await this.handleNotification(data);

    return reply.send({
      message: "OK",
    });
  }

  private async handleNotification(data: WebhookNotification<unknown>) {
    if (
      data.type === WebhookNotificationType.Remind ||
      data.type === WebhookNotificationType.ForceRemind
    ) {
      const payload = data as WebhookNotification<WebhookRemindNotication>;
      await telegramNotificationRemindRoute.produce({
        guildId: data.guildId,
        original: payload.data,
        users: payload.data.aproximatedNotificationUsers,
        type: payload.type,
        monitoring: payload.data.type,
      });
    }

    if (
      data.type === WebhookNotificationType.BumpBanRemoval ||
      data.type === WebhookNotificationType.BumpBanCreation
    ) {
      const payload = data as WebhookNotification<WebhookBumpBanNotification>;
      await telegramNotificationBumpBanRoute.produce({
        guildId: payload.guildId,
        type: payload.type,
        userId: payload.data.userId,
      });
    }
  }
}
