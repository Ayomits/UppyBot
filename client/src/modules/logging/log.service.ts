import { LocalCache } from "@ts-fetcher/cache";
import {
  type EmbedBuilder as DjsBuilder,
  type Guild,
  inlineCode,
  type Snowflake,
  type TextChannel,
  type User,
} from "discord.js";
import { singleton } from "tsyringe";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { SettingsModel } from "#/models/settings.model.js";

import type { RemindType } from "../reminder/reminder.const.js";
import { getCommandByRemindType } from "../reminder/reminder.const.js";

const LOGS_TIMEOUT = 5_000;

type LogValue = {
  channel: TextChannel;
  embeds: DjsBuilder[];
};

@singleton()
export class LogService {
  private cache: LocalCache<Snowflake, LogValue>;

  constructor() {
    this.cache = new LocalCache();
  }

  public async logCommandExecution(
    guild: Guild,
    author: User,
    type: RemindType
  ) {
    const commandName = getCommandByRemindType(type);

    const embed = new EmbedBuilder()
      .setTitle(`Выполнена команда ${commandName}`)
      .setDefaults(author)
      .setDescription(
        `Пользователь ${author} выполнил команду ${inlineCode(commandName)}`
      );
    return await this.push(guild, embed);
  }

  public async logBumpBanCreation(guild: Guild, user: User) {
    const embed = new EmbedBuilder()
      .setDefaults(user)
      .setTitle("Выдан бамп бан")
      .setDescription(`Пользователю ${user} выдан бамп бан`);
    return await this.push(guild, embed);
  }

  public async logBumpBanRoleAdding(guild: Guild, user: User) {
    const embed = new EmbedBuilder()
      .setDefaults(user)
      .setTitle("Выдана бамп бан роль")
      .setDescription(`Пользователю ${user} выдана бамп бан роль`);
    return await this.push(guild, embed);
  }

  public async logBumpBanRemoval(guild: Guild, user: User) {
    const embed = new EmbedBuilder()
      .setDefaults(user)
      .setTitle("Снят бамп бан")
      .setDescription(`Пользователю ${user} снят бамп бан`);
    return await this.push(guild, embed);
  }

  private async push(guild: Guild, embed: DjsBuilder) {
    const settings = await SettingsModel.findOneAndUpdate(
      { guildId: guild.id },
      {},
      { upsert: true }
    );

    const logChannel = guild.channels.cache.get(settings?.logChannelId);

    if (!logChannel || !logChannel.isSendable()) {
      return;
    }

    const existed = this.cache.get<LogValue>(settings.guildId);
    this.cache.set(
      settings.guildId,
      {
        channel: logChannel as TextChannel,
        embeds: [embed, ...(existed?.embeds ?? [])],
      },
      LOGS_TIMEOUT,
      (_, value) => {
        try {
          const batch: DjsBuilder[][] = [];
          if (value.embeds.length > 25) {
            const iterations = value.embeds.length % 25;
            for (let n = 0; n < iterations; n++) {
              const start = (n - 1) * 25;
              const end = n * 25;
              batch.push(value.embeds.slice(start, end));
            }
          } else {
            batch.push(value.embeds);
          }

          batch.forEach((embeds) => {
            setTimeout(() => {
              value.channel.send({ embeds }).catch(null);
            }, 500);
          });
          // eslint-disable-next-line no-empty
        } catch {}
      }
    );
  }
}
