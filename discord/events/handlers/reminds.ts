import {
  bold,
  chatInputApplicationCommandMention,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
  roleMention,
  time,
  TimestampStyles,
  userMention,
} from "discord.js";
import { DateTime } from "luxon";

import {
  getBotByRemindType,
  getCommandIdByRemindType,
  getCommandNameByRemindType,
} from "#/discord/app/public/reminder/reminder.const.js";
import { discordClient } from "#/discord/client.js";
import {
  baseCommonRemindTemplate,
  baseForceRemindTemplate,
  resolveTemplateMention,
} from "#/discord/libs/templates/index.js";
import { GuildRepository } from "#/shared/db/repositories/uppy-discord/guild.repository.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";
import { resolveTimestamp } from "#/shared/libs/embed/timestamp.js";
import { WebhookManager } from "#/shared/webhooks/webhook.manager.js";

import { appEventEmitter } from "../emitter.js";
import type { AppRemindExecute } from "../types.js";
import { AppEventHandler } from "./base.js";

export class AppRemindEventHandler extends AppEventHandler {
  constructor() {
    super();

    appEventEmitter.on("remind:common", (opts) =>
      this.handleRemindExecute.bind(this)(opts, "common"),
    );
    appEventEmitter.on("remind:force", (opts) =>
      this.handleRemindExecute.bind(this)(opts, "force"),
    );

    // webhooks
    appEventEmitter.on("remind:common", (opts) =>
      this.handleWebhook.bind(this)(opts, "common"),
    );
    appEventEmitter.on("remind:force", (opts) =>
      this.handleWebhook.bind(this)(opts, "force"),
    );

    // dev
    appEventEmitter.on("remind:common", (opts) =>
      this.handleDevLog.bind(this)(opts, "common"),
    );
    appEventEmitter.on("remind:force", (opts) =>
      this.handleDevLog.bind(this)(opts, "force"),
    );
  }

  static create() {
    return new AppRemindEventHandler();
  }

  private async handleDevLog(opts: AppRemindExecute, type: "common" | "force") {
    const commandName = getCommandNameByRemindType(opts.type)!;
    const commandId = getCommandIdByRemindType(opts.type)!;
    const guildRepository = GuildRepository.create();

    const guild = await guildRepository.findGuild(opts.settings.guildId!);

    await this.devLog("dev.remindLogs", {
      components: [
        new ContainerBuilder().addTextDisplayComponents((b) =>
          b.setContent(
            [
              heading(`Выслано напоминание`, HeadingLevel.Two),
              `${bold("Команда:")} ${chatInputApplicationCommandMention(commandName, commandId)}`,
              `${bold("Сервер:")} ${guild.guildName}`,
              `${bold("Тип:")} ${type === "common" ? "Обычное" : "Преждевременное"}`,
              `${bold("Аватар:")} ${guild.guildAvatar ?? "Нет"}`,
            ].join("\n"),
          ),
        ),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  private async handleRemindExecute(
    opts: AppRemindExecute,
    type: "common" | "force",
  ) {
    if (!opts.settings.channels?.pingChannelId) {
      return;
    }
    const commandName = getCommandNameByRemindType(opts.type)!;
    const commandId = getCommandIdByRemindType(opts.type)!;
    const timestamp = DateTime.fromJSDate(opts.timestamp!);

    const template =
      type == "force"
        ? (opts.settings.templates?.force ?? baseForceRemindTemplate)
        : (opts.settings.templates?.common ?? baseCommonRemindTemplate);

    const content = resolveTemplateMention(template, {
      roles: opts.settings.roles?.pingRoles?.map(roleMention) ?? [],
      command: chatInputApplicationCommandMention(commandName, commandId),
      monitoring: userMention(getBotByRemindType(opts.type)!),
      time: time(
        resolveTimestamp(timestamp.toJSDate()),
        TimestampStyles.RelativeTime,
      ),
    });

    await this.sendChannelMessage(opts.settings.channels?.pingChannelId, {
      content,
    });
  }

  private async handleWebhook(
    opts: AppRemindExecute,
    type: "common" | "force",
  ) {
    const guild = await discordClient.guilds
      .fetch(opts.guildId)
      .catch(() => null);

    if (!guild) {
      return;
    }

    const webhookManager = WebhookManager.create();
    const crypto = CryptographyService.create();

    if (
      !opts.settings?.telegram?.enabled ||
      !opts.settings.webhooks?.url ||
      !opts.settings.webhooks?.token
    ) {
      return;
    }

    const channel = await guild.channels
      .fetch(opts.settings.channels!.pingChannelId!)
      .catch(() => null);

    if (!channel) {
      return;
    }

    const members = await guild.members.fetch().catch(() => null);

    if (!members) {
      return;
    }

    const fn =
      type === "common"
        ? webhookManager.createRemindPayload.bind(webhookManager)
        : webhookManager.createForceRemindPayload.bind(webhookManager);

    const url = opts.settings.webhooks.url;
    const token = crypto.decrypt(opts.settings.webhooks.token);

    const data = fn(guild.id, {
      guildName: guild.name,
      channelName: channel.name,
      type: opts.type,
      commandName: getCommandNameByRemindType(opts.type)!,
      aproximatedNotificationUsers: members
        .filter((m) =>
          m.roles.cache.some((r) =>
            opts.settings?.roles?.pingRoles?.includes(r.id),
          ),
        )
        .map((m) => m.id),
    });

    await Promise.all([
      webhookManager.pushConsumer(url, token, data),
      webhookManager.pushTelegramNotification(data),
    ]);
  }
}
