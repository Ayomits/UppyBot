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
import {
  baseCommonRemindTemplate,
  baseForceRemindTemplate,
  resolveTemplateMention,
} from "#/discord/libs/templates/index.js";
import { GuildRepository } from "#/shared/db/repositories/uppy-discord/guild.repository.js";
import { resolveTimestamp } from "#/shared/libs/embed/timestamp.js";

import { appEventEmitter } from "../emitter.js";
import type { AppRemindExecute } from "../types.js";
import { AppEventHandler } from "./base.js";

export class AppRemindEventHandler extends AppEventHandler {
  constructor() {
    super();

    appEventEmitter.on("remind:common", (opts) =>
      this.handleRemindExecute(opts, "common")
    );
    appEventEmitter.on("remind:force", (opts) =>
      this.handleRemindExecute(opts, "force")
    );

    // dev
    appEventEmitter.on("remind:common", (opts) =>
      this.handleDevLog(opts, "common")
    );
    appEventEmitter.on("remind:force", (opts) =>
      this.handleDevLog(opts, "force")
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

    console.log(guild);

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
            ].join("\n")
          )
        ),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  private async handleRemindExecute(
    opts: AppRemindExecute,
    type: "common" | "force"
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
        TimestampStyles.RelativeTime
      ),
    });

    await this.sendChannelMessage(opts.settings.channels?.pingChannelId, {
      content,
    });
  }
}
