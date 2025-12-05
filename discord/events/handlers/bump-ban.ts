import {
  heading,
  HeadingLevel,
  MessageFlags,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  unorderedList,
  userMention,
} from "discord.js";
import { inject } from "tsyringe";

import { CryptographyService } from "#/shared/libs/crypto/index.js";
import { WebhookManager } from "#/shared/webhooks/webhook.manager.js";
import { WebhookNotificationType } from "#/shared/webhooks/webhook.types.js";

import { appEventEmitter } from "../index.js";
import type { AppEventOptions } from "../types.js";
import { AppEventHandler } from "./base.js";

export class AppBumpBanEventHandler extends AppEventHandler {
  constructor(
    @inject(WebhookManager) private webhookManager: WebhookManager,
    @inject(CryptographyService) private cryptography: CryptographyService,
  ) {
    super();
    appEventEmitter.on("bump-ban:created", (opts) =>
      this.handleBumpBanLog(opts, "created"),
    );
    appEventEmitter.on("bump-ban:removed", (opts) =>
      this.handleBumpBanLog(opts, "removed"),
    );

    appEventEmitter.on("bump-ban:created", (opts) =>
      this.handleBumpBanSendWebhook(opts, "created"),
    );
    appEventEmitter.on("bump-ban:removed", (opts) =>
      this.handleBumpBanSendWebhook(opts, "removed"),
    );
  }

  static create() {
    return new AppBumpBanEventHandler(
      WebhookManager.create(),
      CryptographyService.create(),
    );
  }

  private async handleBumpBanLog(
    options: AppEventOptions,
    type: "removed" | "created",
  ) {
    if (options.settings.channels?.bumpBanChannelId) {
      const actionText =
        type === "created" ? "Выдан бамп бан" : "Снят бамп бан";
      await this.sendChannelMessage(
        options.settings.channels.bumpBanChannelId,
        {
          components: [
            new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  [
                    heading(actionText, HeadingLevel.Two),
                    unorderedList([
                      `Пользователь: ${userMention(options.userId)}`,
                    ]),
                  ].join("\n"),
                ),
              )
              .setThumbnailAccessory(
                new ThumbnailBuilder().setURL(options.avatarUrl!),
              ),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: {
            users: [],
          },
        },
      );
    }
  }

  private handleBumpBanSendWebhook(
    options: AppEventOptions,
    type: "removed" | "created",
  ) {
    if (options.settings?.webhooks?.url) {
      this.webhookManager.pushConsumer(
        options.settings.webhooks?.url,
        this.cryptography.decrypt(options.settings.webhooks.token!),
        this.webhookManager.createBumpBanPayload(
          options.guildId,
          type === "created"
            ? WebhookNotificationType.BumpBanCreation
            : WebhookNotificationType.BumpBanRemoval,
          {
            userId: options.userId,
            executedAt: new Date(),
          },
        ),
      );
    }
  }
}
