import type { FastifyReply, FastifyRequest } from "fastify";

import { telegramRemindNotificationProduce } from "#/queue/routes/telegram-notification/producers/index.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { Env } from "#/shared/libs/config/index.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";
import { logger } from "#/shared/libs/logger/logger.js";
import type { WebhookRemindNotication } from "#/shared/webhooks/webhook.types.js";
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
    const data = req.body as WebhookNotification<WebhookRemindNotication>;

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

    logger.info("Received new webhook:", data.type);

    if (data.type === WebhookNotificationType.Remind) {
      logger.info(
        `Remind Users: ${data.data.aproximatedNotificationUsers.length}`
      );
      await telegramRemindNotificationProduce({
        guildId: data.guildId,
        original: data.data,
        users: data.data.aproximatedNotificationUsers,
        type: data.data.type,
      });
    }

    return reply.send({
      message: "OK",
    });
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
