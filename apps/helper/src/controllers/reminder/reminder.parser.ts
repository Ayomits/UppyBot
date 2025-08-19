import type { Message, Snowflake } from "discord.js";
import { DateTime } from "luxon";
import { injectable } from "tsyringe";

import {
  DefaultTimezone,
  MonitoringBot,
  MonitoringBotMessage,
  MonitoringCooldownHours,
  RemindType,
} from "./reminder.const.js";

export interface ParserValue {
  guild: Snowflake;
  authorId: Snowflake;
  success: boolean;
  timestamp: Date | null;
  type: RemindType;
}

@injectable()
export class ReminderParser {
  public handleMonitoring(message: Message): ParserValue | void {
    const handler = this.getHandler(message.author.id as MonitoringBot);

    if (!handler) {
      return;
    }

    return handler?.(message);
  }

  public getHandler(monitoring: MonitoringBot) {
    if (monitoring === MonitoringBot.DiscordMonitoring) {
      return this.handleDiscordMonitoring.bind(this);
    } else if (monitoring === MonitoringBot.SdcMonitoring) {
      return this.handleSdcMonitoring.bind(this);
    } else if (monitoring === MonitoringBot.ServerMonitoring) {
      return this.handleServerMonitoring.bind(this);
    }
    return null;
  }

  public handleSdcMonitoring(message: Message): ParserValue {
    const embed = message.embeds[0];

    if (!embed?.description) {
      return;
    }

    const guildId = message.guildId;
    const authorId = message.interactionMetadata?.user?.id ?? message.author.id;

    const match = embed.description?.match(/<t:(\d+):[tTdDfFR]?>/);

    const discordMessageTimestampDate = DateTime.fromJSDate(
      new Date(Number(match[1]) * 1_000),
    ).setZone(DefaultTimezone);

    if (
      embed.description?.includes(MonitoringBotMessage.sdcMonitoring.success)
    ) {
      const timestamp = discordMessageTimestampDate
        .setZone(DefaultTimezone)
        .plus({ hours: MonitoringCooldownHours })
        .toJSDate();

      return this.handleSuccess(
        timestamp,
        guildId,
        authorId,
        RemindType.SdcMonitoring,
      );
    }

    return this.handleFailure(
      discordMessageTimestampDate.toJSDate(),
      guildId,
      authorId,
      RemindType.SdcMonitoring,
    );
  }

  public handleServerMonitoring(message: Message): ParserValue {
    const emptyPayload = this.handleEmptyEmbeds(message);
    if (emptyPayload) return emptyPayload;

    const embed = message.embeds[0];

    const guildId = message.guildId;
    const authorId =
      message?.interactionMetadata?.user?.id ?? message.author.id;

    if (
      embed.description.includes(MonitoringBotMessage.serverMonitoring.success)
    ) {
      const timestamp = DateTime.now()
        .setZone(DefaultTimezone)
        .plus({ hours: MonitoringCooldownHours })
        .toJSDate();
      return this.handleSuccess(
        timestamp,
        guildId,
        authorId,
        RemindType.ServerMonitoring,
      );
    }

    const timestampRegex = /\d{1,2}:\d{1,2}:\d{1,2}/;
    const splited = embed.description
      .match(timestampRegex)[0]
      .split(":")
      .map((i) => Number(i));

    const timestamp = DateTime.now()
      .plus({
        hours: splited[0] ?? 0,
        minutes: splited[1] ?? 0,
        seconds: splited[2] ?? 0,
      })
      .toJSDate();

    return this.handleFailure(
      timestamp,
      guildId,
      authorId,
      RemindType.ServerMonitoring,
    );
  }

  public handleDiscordMonitoring(message: Message): ParserValue {
    const emptyPayload = this.handleEmptyEmbeds(message);
    if (emptyPayload) return emptyPayload;

    const embed = message.embeds[0];

    const guildId = message.guildId;
    const authorId = message.interactionMetadata?.user?.id ?? message.author.id;

    const timestamp = DateTime.fromJSDate(new Date(embed.timestamp))
      .setZone(DefaultTimezone)
      .toJSDate();

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

  public handleEmptyEmbeds(message: Message): ParserValue {
    if (!message.embeds.length) {
      return this.handleFailure(
        null,
        message.guildId,
        message.interactionMetadata?.user?.id ?? message.author.id,
        RemindType.DiscordMonitoring,
      );
    }
  }

  public handleSuccess(
    timestamp: Date | null,
    guildId: string,
    authorId: string,
    type: RemindType,
  ): ParserValue {
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
  ): ParserValue {
    return {
      timestamp: timestamp,
      success: false,
      guild: guildId,
      authorId: authorId,
      type,
    };
  }
}
