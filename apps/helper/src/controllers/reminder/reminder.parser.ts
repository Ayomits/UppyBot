import type { Message, Snowflake } from "discord.js";
import { injectable } from "tsyringe";

import {
  MonitoringBot,
  MonitoringBotMessage,
  RemindType,
} from "./reminder.const.js";

interface HandlerValue {
  guild: Snowflake;
  authorId: Snowflake;
  success: boolean;
  timestamp: Date | null;
  type: RemindType;
}

@injectable()
export class ReminderParser {
  public handleMonitoring(message: Message) {
    const handler = this.getHandler(message.author.id as MonitoringBot);

    if (!handler) {
      return;
    }

    return handler?.(message);
  }

  public getHandler(monitoring: MonitoringBot) {
    if (monitoring === MonitoringBot.DiscordMonitoring) {
      return this.handleDiscordMonitoring;
    } else if (monitoring === MonitoringBot.SdcMonitoring) {
      return this.handleSdcMonitoring;
    } else if (monitoring === MonitoringBot.ServerMonitoring) {
      return this.handleServerMonitoring;
    } else {
      return null;
    }
  }

  public handleSdcMonitoring(message: Message): HandlerValue {
    const embed = message.embeds[0];

    if (!embed?.description) {
      return;
    }

    const guildId = message.guildId;
    const authorId = message.interactionMetadata.user.id;

    const match = embed.description?.match(/<t:(\d+):[tTdDfFR]?>/);
    if (
      embed.description?.includes(MonitoringBotMessage.sdcMonitoring.success)
    ) {
      const timestamp = new Date(Number(match[1]));
      return this.handleSuccess(
        timestamp,
        guildId,
        authorId,
        RemindType.SdcMonitoring,
      );
    }

    return this.handleFailure(
      new Date(),
      guildId,
      authorId,
      RemindType.SdcMonitoring,
    );
  }

  public handleServerMonitoring(message: Message): HandlerValue {
    const emptyPayload = this.handleEmptyEmbeds(message);
    if (emptyPayload) return emptyPayload;

    const embed = message.embeds[0];

    const guildId = message.guildId;
    const authorId = message.interactionMetadata.user.id;

    const now = new Date();

    if (
      embed.description.includes(MonitoringBotMessage.serverMonitoring.success)
    ) {
      const timestamp = new Date(now.getTime() + 3_600 * 4 * 1_000);
      return this.handleSuccess(
        timestamp,
        guildId,
        authorId,
        RemindType.ServerMonitoring,
      );
    }

    const timestampRegex = /\d{1,2}:\d{1,2}:\d{1,2}/;
    const splited = embed.description.match(timestampRegex)[0].split(":");

    const miliSeconds =
      (Number(splited[0]) * 3_600 +
        Number(splited[1]) * 60 +
        Number(splited[2])) *
      1_000;

    const timestamp = new Date(now.getTime() + miliSeconds);

    return this.handleFailure(
      timestamp,
      guildId,
      authorId,
      RemindType.ServerMonitoring,
    );
  }

  public handleDiscordMonitoring(message: Message): HandlerValue {
    const emptyPayload = this.handleEmptyEmbeds(message);
    if (emptyPayload) return emptyPayload;

    const embed = message.embeds[0];

    const guildId = message.guildId;
    const authorId = message.interactionMetadata.user.id;

    const timestamp = new Date(embed.timestamp);

    if (
      MonitoringBotMessage.discordMonitoring.success.find((m) =>
        embed.description.includes(m),
      )
    ) {
      return this.handleSuccess(
        timestamp,
        guildId,
        authorId,
        RemindType.DiscordMonitoring,
      );
    }

    return this.handleFailure(
      timestamp,
      guildId,
      authorId,
      RemindType.DiscordMonitoring,
    );
  }

  public handleEmptyEmbeds(message: Message): HandlerValue {
    if (!message.embeds.length) {
      return this.handleFailure(
        null,
        message.guildId,
        message.interactionMetadata.user.id,
        RemindType.DiscordMonitoring,
      );
    }
  }

  public handleSuccess(
    timestamp: Date | null,
    guildId: string,
    authorId: string,
    type: RemindType,
  ): HandlerValue {
    return {
      timestamp: timestamp,
      success: true,
      guild: guildId,
      authorId: authorId,
      type: type,
    };
  }

  public handleFailure(
    timestamp: Date | null,
    guildId: string,
    authorId: string,
    type: RemindType,
  ): HandlerValue {
    return {
      timestamp: timestamp,
      success: false,
      guild: guildId,
      authorId: authorId,
      type,
    };
  }
}
