import type { FastifyReply, FastifyRequest } from "fastify";

import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";
import type { WebhookNotification } from "#/shared/webhooks/webhook.types.js";

import { WEBHOOKS_URL } from "../const/index.js";
import { HTTPStatus } from "../const/status.js";

export class UppyNotificationService {
  static create() {
    return new UppyNotificationService();
  }

  async handleNotificationWebhook(req: FastifyRequest, reply: FastifyReply) {
    const data = req.body as WebhookNotification<unknown>;

    const isValidToken = await this.validateToken(
      data.guildId,
      req.query?.["token"]
    );

    if (!isValidToken) {
      return reply.code(HTTPStatus.Forbidden).send({
        message: "Invalid token provided",
      });
    }

    console.log(data);

    return reply.send(req.body);
  }

  private async validateToken(
    guildId: string,
    token?: string
  ): Promise<boolean> {
    if (!token) return false;
    const settingsRepository = SettingsRepository.create();

    const settings = await settingsRepository.findGuildSettings(guildId);

    if (!settings.webhooks.url || settings.webhooks.url !== WEBHOOKS_URL)
      return false;

    const cryptography = CryptographyService.create();
    const decryptedToken = cryptography.decrypt(settings.webhooks.token ?? "");

    return decryptedToken === token;
  }
}
