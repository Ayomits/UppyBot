import {
  chatInputApplicationCommandMention,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
  unorderedList,
  userMention,
} from "discord.js";
import { inject } from "tsyringe";

import {
  getCommandIdByRemindType,
  getCommandNameByRemindType,
} from "#/discord/app/public/reminder/reminder.const.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";
import { WebhookManager } from "#/shared/webhooks/webhook.manager.js";

import { appEventEmitter } from "../emitter.js";
import type { AppCommandSuccessOptions } from "../types.js";
import { AppEventHandler } from "./base.js";

export class AppCommandEventHandler extends AppEventHandler {
  constructor(
    @inject(WebhookManager) private webhookManager: WebhookManager,
    @inject(CryptographyService) private cryptography: CryptographyService,
  ) {
    super();

    this.handleCommandSuccessLog = this.handleCommandSuccessLog.bind(this);
    this.handleCommandSuccessWebhook =
      this.handleCommandSuccessWebhook.bind(this);

    appEventEmitter.on(
      "command:executed",
      this.handleCommandSuccessLog.bind(this),
    );
    appEventEmitter.on(
      "command:executed",
      this.handleCommandSuccessWebhook.bind(this),
    );
  }

  static create() {
    return new AppCommandEventHandler(
      WebhookManager.create(),
      CryptographyService.create(),
    );
  }

  private async handleCommandSuccessLog(options: AppCommandSuccessOptions) {
    if (!options.settings.channels?.commandChannelId) {
      return;
    }

    const commandName = getCommandNameByRemindType(options.type)!;
    const commandId = getCommandIdByRemindType(options.type)!;

    const commandMention = chatInputApplicationCommandMention(
      commandName,
      commandId,
    );

    await this.sendChannelMessage(options.settings.channels.commandChannelId, {
      components: [
        new ContainerBuilder().addTextDisplayComponents((b) => {
          return b.setContent(
            [
              heading(`Выполнена команда ${commandName}`, HeadingLevel.Two),
              unorderedList([
                `Команда: ${commandMention}`,
                `Поинты: ${options.points}`,
                `Исполнитель: ${userMention(options.userId)}`,
                `Время реакции: ${options.reactionTime}`,
              ]),
            ].join("\n"),
          );
        }),
      ],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: {
        users: [],
      },
    });
  }

  private handleCommandSuccessWebhook(options: AppCommandSuccessOptions) {
    if (options.settings.webhooks?.url) {
      this.webhookManager.pushConsumer(
        options.settings.webhooks?.url,
        this.cryptography.decrypt(options.settings.webhooks.token!),
        this.webhookManager.createCommandExecutedPayload(options.guildId, {
          channelId: options.channelId,
          executedAt: new Date(),
          points: options.points,
          type: options.type,
          userId: options.userId,
        }),
      );
    }
  }
}
