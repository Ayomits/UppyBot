import type { FastifyReply, FastifyRequest } from "fastify";

import {
  telegramBumpBanNotificationProduce,
  telegramRemindNotificationProduce,
} from "#/queue/routes/telegram-notification/producers/index.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { Env } from "#/shared/libs/config/index.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";
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

    if (data.type === WebhookNotificationType.Test) {
      return reply.send("OK");
    }

    const isValidToken = await this.validateToken(
      data.guildId,
      req.query?.["token"]
    );

    if (!isValidToken) {
      return reply.code(HTTPStatus.Forbidden).send({
        message: "Invalid token provided",
      });
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
      await telegramRemindNotificationProduce({
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
      await telegramBumpBanNotificationProduce({
        guildId: payload.guildId,
        type: payload.type,
        userId: payload.data.userId,
      });
    }
  }

  private async validateToken(
    guildId: string,
    token?: string
  ): Promise<boolean> {
    if (!token) return false;
    const settingsRepository = SettingsRepository.create();

    const settings = await settingsRepository.findGuildSettings(guildId);

    if (
      !settings.webhooks.url ||
      settings.webhooks.url !== `${Env.UppyUrl}/uppy/notifications`
    )
      return false;

    const cryptography = CryptographyService.create();
    const decryptedToken = cryptography.decrypt(settings.webhooks.token ?? "");

    return decryptedToken === token;
  }
}
