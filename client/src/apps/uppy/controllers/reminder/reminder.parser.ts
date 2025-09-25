import type { Guild, Message, Snowflake } from "discord.js";
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
  guild: Guild;
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
    } else if (monitoring === MonitoringBot.DisboardMonitoring) {
      return this.handleDisboardMonitoring.bind(this);
    }
    return null;
  }

  public handleSdcMonitoring(message: Message): ParserValue {
    const embed = message.embeds[0];

    if (!embed?.description) {
      return;
    }

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
        message.guild,
        authorId,
        RemindType.SdcMonitoring,
      );
    }

    return this.handleFailure(
      discordMessageTimestampDate.toJSDate(),
      message.guild,
      authorId,
      RemindType.SdcMonitoring,
    );
  }

  public handleServerMonitoring(message: Message): ParserValue {
    const emptyPayload = this.handleEmptyEmbeds(message);
    if (emptyPayload) return emptyPayload;

    const embed = message.embeds[0];
    const authorId =
      message?.interactionMetadata?.user?.id ?? message.author.id;

    const messageCreatedAt = new Date(message.createdTimestamp);

    const includesSuccess = embed.description?.includes(
      MonitoringBotMessage.serverMonitoring.success,
    );
    const includesFailure = embed.description.includes(
      MonitoringBotMessage.serverMonitoring.failure,
    );

    if (!includesFailure && !includesSuccess) {
      return;
    }

    if (includesSuccess) {
      const timestamp = DateTime.fromJSDate(messageCreatedAt)
        .setZone(DefaultTimezone)
        .plus({ hours: MonitoringCooldownHours })
        .set({ millisecond: 0 })
        .toJSDate();

      return this.handleSuccess(
        timestamp,
        message.guild,
        authorId,
        RemindType.ServerMonitoring,
      );
    }

    const timestampRegex = /(\d{1,2}):(\d{1,2}):(\d{1,2})/;
    const timeMatch = embed.description.match(timestampRegex);

    if (!timeMatch) {
      return;
    }

    const hours = parseInt(timeMatch[1]) || 0;
    const minutes = parseInt(timeMatch[2]) || 0;
    const seconds = parseInt(timeMatch[3]) || 0;

    const timestamp = DateTime.now()
      .plus({ hours, minutes, seconds })
      .set({ millisecond: 0 })
      .toJSDate();

    return this.handleFailure(
      timestamp,
      message.guild,
      authorId,
      RemindType.ServerMonitoring,
    );
  }

  public handleDisboardMonitoring(message: Message): ParserValue {
    const emptyPayload = this.handleEmptyEmbeds(message);
    if (emptyPayload) return emptyPayload;

    const embed = message.embeds[0];
    const authorId =
      message?.interactionMetadata?.user?.id ?? message.author.id;

    const includesSuccess = embed.description?.includes(
      MonitoringBotMessage.disboardMonitoring.success,
    );
    const includesFailure = embed.description.includes(
      MonitoringBotMessage.disboardMonitoring.failure,
    );

    if (!includesFailure && !includesSuccess) {
      return;
    }

    if (includesSuccess) {
      const timestamp = DateTime.now()
        .plus({ hours: 2 })
        .set({ millisecond: 0 })
        .toJSDate();
      return this.handleSuccess(
        timestamp,
        message.guild,
        authorId,
        RemindType.DisboardMonitoring,
      );
    }

    return;
  }

  public handleDiscordMonitoring(message: Message): ParserValue {
    const emptyPayload = this.handleEmptyEmbeds(message);
    if (emptyPayload) return emptyPayload;

    const embed = message.embeds[0];

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
        message.guild,
        authorId,
        RemindType.DiscordMonitoring,
      );
    }

    return this.handleFailure(
      timestamp,
      message.guild,
      authorId,
      RemindType.DiscordMonitoring,
    );
  }

  public handleEmptyEmbeds(message: Message): ParserValue {
    if (!message.embeds.length) {
      return this.handleFailure(
        null,
        message.guild,
        message.interactionMetadata?.user?.id ?? message.author.id,
        RemindType.DiscordMonitoring,
      );
    }
  }

  public handleSuccess(
    timestamp: Date | null,
    guild: Guild,
    authorId: string,
    type: RemindType,
  ): ParserValue {
    return {
      timestamp,
      success: true,
      guild,
      authorId,
      type,
    };
  }

  public handleFailure(
    timestamp: Date | null,
    guild: Guild,
    authorId: string,
    type: RemindType,
  ): ParserValue {
    return {
      timestamp,
      success: false,
      guild,
      authorId,
      type,
    };
  }
}
