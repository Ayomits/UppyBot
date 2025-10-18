import { codeBlock, Events, quote } from "discord.js";
import type { ArgsOf } from "discordx";
import { Discord, On } from "discordx";
import { singleton } from "tsyringe";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";

import { PrivateLogConfig } from "./logs.const.js";

@Discord()
@singleton()
export class PrivateLogController {
  @On({ event: Events.GuildCreate })
  handleGuildCreate([guild]: ArgsOf<Events.GuildCreate>) {
    const client = guild.client;

    const channel = client.guilds.cache
      .get(PrivateLogConfig.GuildId)
      ?.channels.cache.get(PrivateLogConfig.Logs.Invites);
    if (!channel) {
      return;
    }

    if (channel.isSendable()) {
      const embed = new EmbedBuilder()
        .setTitle("Новый сервер")
        .setThumbnail(guild.iconURL())
        .setFields(
          {
            name: quote("Название"),
            value: codeBlock(guild.name),
            inline: true,
          },
          {
            name: quote("Участников"),
            value: codeBlock(guild.memberCount.toString()),
            inline: true,
          },
          {
            name: "Server ID",
            value: codeBlock(guild.id),
            inline: true,
          }
        );
      channel
        .send({
          embeds: [embed],
        })
        .catch(null);
    }
  }

  @On({ event: Events.GuildDelete })
  handleGuildDelete([guild]: ArgsOf<Events.GuildDelete>) {
    const client = guild.client;

    const channel = client.guilds.cache
      .get(PrivateLogConfig.GuildId)
      ?.channels.cache.get(PrivateLogConfig.Logs.Leaves);
    if (!channel) {
      return;
    }

    if (channel.isSendable()) {
      const embed = new EmbedBuilder()
        .setTitle("Бот удалён с сервера")
        .setThumbnail(guild.iconURL())
        .setFields(
          {
            name: quote("Название"),
            value: codeBlock(guild.name),
            inline: true,
          },
          {
            name: quote("Участников"),
            value: codeBlock(guild.memberCount.toString()),
            inline: true,
          },
          {
            name: "Server ID",
            value: codeBlock(guild.id),
            inline: true,
          }
        );
      channel
        .send({
          embeds: [embed],
        })
        .catch(null);
    }
  }
}
