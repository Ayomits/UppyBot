import {
  ContainerBuilder,
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
    @inject(CryptographyService) private cryptography: CryptographyService
  ) {
    super();
    appEventEmitter.on("bump-ban:created", (opts) =>
      this.handleBumpBanLog.bind(this)(opts, "created")
    );
    appEventEmitter.on("bump-ban:removed", (opts) =>
      this.handleBumpBanLog.bind(this)(opts, "removed")
    );

    appEventEmitter.on("bump-ban:created", (opts) =>
      this.handleBumpBanSendWebhook.bind(this)(opts, "created")
    );
    appEventEmitter.on("bump-ban:removed", (opts) =>
      this.handleBumpBanSendWebhook.bind(this)(opts, "removed")
    );

     appEventEmitter.on("bump-ban:created", (opts) =>
      this.handleBumpBanSendTelegram.bind(this)(opts, "created")
    );
    appEventEmitter.on("bump-ban:removed", (opts) =>
      this.handleBumpBanSendTelegram.bind(this)(opts, "removed")
    );
  }

  static create() {
    return new AppBumpBanEventHandler(
      WebhookManager.create(),
      CryptographyService.create()
    );
  }

  private async handleBumpBanLog(
    options: AppEventOptions,
    type: "removed" | "created"
  ) {
    if (options.settings.channels?.bumpBanChannelId) {
      const actionText =
        type === "created" ? "Выдан бамп бан" : "Снят бамп бан";
      await this.sendChannelMessage(
        options.settings.channels.bumpBanChannelId,
        {
          components: [
            new ContainerBuilder().addSectionComponents(
              new SectionBuilder()
                .addTextDisplayComponents(
                  new TextDisplayBuilder().setContent(
                    [
                      heading(actionText, HeadingLevel.Two),
                      unorderedList([
                        `Пользователь: ${userMention(options.userId)}`,
                      ]),
                    ].join("\n")
                  )
                )
                .setThumbnailAccessory(
                  new ThumbnailBuilder().setURL(options.avatarUrl!)
                )
            ),
          ],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: {
            users: [],
          },
        }
      );
    }
  }

  private handleBumpBanSendWebhook(
    opts: AppEventOptions,
    type: "removed" | "created"
  ) {
    if (opts.settings?.webhooks?.url) {
      const crypto = CryptographyService.create();
      const url = opts.settings.webhooks.url;
      const token = crypto.decrypt(opts.settings.webhooks.token!);

      this.webhookManager.pushConsumer(url, token, this.getWebhookData(opts, type));
    }
  }

  private handleBumpBanSendTelegram(opts: AppEventOptions,
    type: "removed" | "created") {
    this.webhookManager.pushTelegramNotification(
        this.getWebhookData(opts, type)
      );
  }

  private getWebhookData(opts: AppEventOptions, type: "removed" | "created") {
    return this.webhookManager.createBumpBanPayload(
      opts.guildId,
      type === "created"
        ? WebhookNotificationType.BumpBanCreation
        : WebhookNotificationType.BumpBanRemoval,
      {
        userId: opts.userId,
        executedAt: new Date(),
      }
    );
  }
}
