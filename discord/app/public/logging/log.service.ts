import {
  chatInputApplicationCommandMention,
  ContainerBuilder,
  type Guild,
  heading,
  HeadingLevel,
  MessageFlags,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  unorderedList,
  type User,
} from "discord.js";
import { inject, singleton } from "tsyringe";

import type { Settings } from "#/shared/db/models/uppy-discord/settings.model.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { UsersUtility } from "#/shared/libs/embed/users.utility.js";

import type { MonitoringType } from "../reminder/reminder.const.js";
import {
  getCommandIdByRemindType,
  getCommandNameByRemindType,
} from "../reminder/reminder.const.js";

@singleton()
export class BumpLogService {
  constructor(
    @inject(SettingsRepository) private settingsRepository: SettingsRepository
  ) {}

  public async sendCommandExecutionLog(
    guild: Guild,
    author: User,
    type: MonitoringType,
    points: number,
    reactionTime: string
  ) {
    const commandName = getCommandNameByRemindType(type)!;
    const commandId = getCommandIdByRemindType(type)!;

    const commandMention = chatInputApplicationCommandMention(
      commandName,
      commandId
    );

    const container = new ContainerBuilder().addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              heading(`Выполнена команда ${commandName}`, HeadingLevel.Two),
              unorderedList([
                `Команда: ${commandMention}`,
                `Поинты: ${points}`,
                `Исполнитель: ${author}`,
                `Время реакции: ${reactionTime}`,
              ]),
            ].join("\n")
          )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(UsersUtility.getAvatar(author))
        )
    );

    return await this.push(guild, container, "commandChannelId");
  }

  public async sendBumpBanCreationLog(guild: Guild, user: User) {
    const container = new ContainerBuilder().addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              heading("Выдан бамп бан", HeadingLevel.Two),
              unorderedList([`Пользователь: ${user}`]),
            ].join("\n")
          )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(UsersUtility.getAvatar(user))
        )
    );
    return await this.push(guild, container, "bumpBanChannelId");
  }

  public async sendBumpBanRemovalLog(guild: Guild, user: User) {
    const container = new ContainerBuilder().addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              heading("Снят бамп бан", HeadingLevel.Two),
              unorderedList([`Пользователь: ${user}`]),
            ].join("\n")
          )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(UsersUtility.getAvatar(user))
        )
    );
    return await this.push(guild, container, "bumpBanChannelId");
  }

  private async push(
    guild: Guild,
    embed: ContainerBuilder,
    type: keyof Settings["channels"]
  ) {
    const settings = await this.settingsRepository.findGuildSettings(guild.id);

    const logChannel = await guild.channels
      .fetch(settings?.channels[type] ?? "")
      .catch(null);

    if (!logChannel || !logChannel?.isSendable?.()) {
      return;
    }

    await logChannel
      .send({
        components: [embed],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: {
          parse: [],
        },
      })
      .catch(null);
  }
}
