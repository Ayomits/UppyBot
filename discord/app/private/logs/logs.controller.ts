import { codeBlock, Events, quote } from "discord.js";
import type { ArgsOf } from "discordx";
import { Discord, On } from "discordx";
import { singleton } from "tsyringe";

import { EmbedBuilder } from "#/shared/libs/embed/embed.builder.js";

import { PrivateLogConfig } from "./logs.const.js";

@Discord()
@singleton()
export class PrivateLogController {
  @On({ event: Events.GuildCreate })
  async handleGuildCreate([guild]: ArgsOf<Events.GuildCreate>) {
    try {
      const client = guild.client;

      const channel = await client.channels
        .fetch(PrivateLogConfig.Logs.Invites)
        .catch(null);
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
            },
          );
        await channel
          .send({
            embeds: [embed],
          })
          .catch(null);
      }
    } catch {
      //
    }
  }

  @On({ event: Events.GuildDelete })
  async handleGuildDelete([guild]: ArgsOf<Events.GuildDelete>) {
    try {
      const client = guild.client;

      const channel = await client.channels
        .fetch(PrivateLogConfig.Logs.Leaves)
        .catch(null);
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
            },
          );
        await channel
          .send({
            embeds: [embed],
          })
          .catch(null);
      }
    } catch {
      //
    }
  }
}
