import { LocalCache } from "@ts-fetcher/cache";
import {
  chatInputApplicationCommandMention,
  ContainerBuilder,
  type Guild,
  heading,
  HeadingLevel,
  MessageFlags,
  SectionBuilder,
  type Snowflake,
  type TextChannel,
  TextDisplayBuilder,
  ThumbnailBuilder,
  unorderedList,
  type User,
} from "discord.js";
import { inject, singleton } from "tsyringe";

import { SettingsRepository } from "#/db/repositories/settings.repository.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";

import type { MonitoringType } from "../reminder/reminder.const.js";
import {
  getCommandIdByRemindType,
  getCommandNameByRemindType,
} from "../reminder/reminder.const.js";

const LOGS_TIMEOUT = 5_000;

type LogValue = {
  channel: TextChannel;
  components: ContainerBuilder[];
};

@singleton()
export class BumpLogService {
  private cache: LocalCache<Snowflake, LogValue>;

  constructor(
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
  ) {
    this.cache = new LocalCache();
  }

  public async sendCommandExecutionLog(
    guild: Guild,
    author: User,
    type: MonitoringType,
    points: number,
    reactionTime: string,
  ) {
    const commandName = getCommandNameByRemindType(type)!;
    const commandId = getCommandIdByRemindType(type)!;

    const commandMention = chatInputApplicationCommandMention(
      commandName,
      commandId,
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
            ].join("\n"),
          ),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(UsersUtility.getAvatar(author)),
        ),
    );

    return await this.push(guild, container);
  }

  public async sendBumpBanCreationLog(guild: Guild, user: User) {
    const container = new ContainerBuilder().addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              heading("Выдан бамп бан", HeadingLevel.Two),
              unorderedList([`Пользователь: ${user}`]),
            ].join("\n"),
          ),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(UsersUtility.getAvatar(user)),
        ),
    );
    return await this.push(guild, container);
  }

  public async sendBumpBanRemovalLog(guild: Guild, user: User) {
    const container = new ContainerBuilder().addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              heading("Снят бамп бан", HeadingLevel.Two),
              unorderedList([`Пользователь: ${user}`]),
            ].join("\n"),
          ),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(UsersUtility.getAvatar(user)),
        ),
    );
    return await this.push(guild, container);
  }

  private async push(guild: Guild, embed: ContainerBuilder) {
    const settings = await this.settingsRepository.findGuildSettings(guild.id);

    const logChannel = await guild.channels
      .fetch(settings?.channels.actionLogChannelId ?? "")
      .catch(null);

    if (!logChannel || !logChannel.isSendable()) {
      return;
    }

    const existed = this.cache.get<LogValue>(settings!.guildId);
    this.cache.set(
      settings!.guildId,
      {
        channel: logChannel as TextChannel,
        components: [embed, ...(existed?.components ?? [])],
      },
      LOGS_TIMEOUT,
      (_, value) => {
        try {
          const batch: ContainerBuilder[][] = [];
          const maxComponentsSize = 5;
          if (value.components.length > maxComponentsSize) {
            const iterations = value.components.length % maxComponentsSize;
            for (let n = 0; n < iterations; n++) {
              const start = (n - 1) * maxComponentsSize;
              const end = n * maxComponentsSize;
              batch.push(value.components.slice(start, end));
            }
          } else {
            batch.push(value.components);
          }

          batch.forEach((components) => {
            setTimeout(() => {
              value.channel
                .send({
                  components,
                  flags: MessageFlags.IsComponentsV2,
                  allowedMentions: {
                    parse: [],
                  },
                })
                .catch(null);
            }, 500);
          });
          // eslint-disable-next-line no-empty
        } catch {}
      },
    );
  }
}
