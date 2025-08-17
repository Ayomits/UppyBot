/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Message, Snowflake } from "discord.js";
import { injectable } from "tsyringe";

import type { RemindType } from "#/models/reminder.model.js";
import { RemindModel } from "#/models/reminder.model.js";

import { MonitoringBot, MonitoringBotMessage } from "./reminder.const.js";

interface HandlerValue {
  guild: Snowflake;
  author: Snowflake;
  success: boolean;
  timestamp: Date | null;
}

@injectable()
export class ReminderParser {
  public handleMonitoring(message: Message) {
    const handlers = {
      [MonitoringBot.DiscordMonitoring]:
        this.handleDiscordMonitoring.bind(this),
      [MonitoringBot.SdcMonitoring]: this.handleSdcMonitoring.bind(this),
      [MonitoringBot.ServerMonitoring]: this.handleServerMonitoring.bind(this),
    };

    return handlers[message.author.id as MonitoringBot]?.(message);
  }

  private handleSdcMonitoring(message: Message): HandlerValue {
    const embed = message.embeds[0];

    return {
      timestamp: new Date(),
      success: true,
      guild: "",
      author: "",
    };
  }

  private async handleServerMonitoring(
    message: Message,
  ): Promise<HandlerValue> {
    const emptyPayload = this.handleEmptyEmbeds(message);
    if (emptyPayload) return emptyPayload;

    const embed = message.embeds[0];

    const guildId = message.guildId;
    const authorId = message.interactionMetadata.user.id;

    const now = Date.now();

    if (
      embed.description.includes(MonitoringBotMessage.serverMonitoring.success)
    ) {
      const timestamp = new Date(now + 3_600 * 1_000);
      return this.handleSuccess(timestamp, guildId, authorId);
    }

    const timestampRegex = /\d{1,2}:\d{1,2}:\d{1,2}/g;
    const miliSeconds = Array.from(
      embed.description
        .matchAll(timestampRegex)
        .map((i) => i[0])
        .map((i) => {
          const splited = i.split(":");
          return (
            (Number(splited[0]) * 3_600 +
              Number(splited[1]) * 60 +
              Number(splited[2])) *
            1_000
          );
        }),
    )[0];

    const timestamp = new Date(now + miliSeconds);

    return this.handleFailure(timestamp, guildId, authorId);
  }

  private handleDiscordMonitoring(message: Message): HandlerValue {
    const emptyPayload = this.handleEmptyEmbeds(message);
    if (emptyPayload) return emptyPayload;

    return {
      timestamp: new Date(),
      success: true,
      guild: "",
      author: "",
    };
  }

  private handleEmptyEmbeds(message: Message): HandlerValue {
    if (!message.embeds.length) {
      return this.handleFailure(
        null,
        message.guildId,
        message.interactionMetadata.user.id,
      );
    }
  }

  private handleSuccess(
    timestamp: Date | null,
    guildId: string,
    author: string,
  ) {
    return {
      timestamp: timestamp,
      success: true,
      guild: guildId,
      author: author,
    };
  }

  private handleFailure(
    timestamp: Date | null,
    guildId: string,
    author: string,
  ) {
    return {
      timestamp: timestamp,
      success: false,
      guild: guildId,
      author: author,
    };
  }

  private async fetchByType(
    guildId: string,
    type: RemindType,
    timestamp: Date,
  ) {
    return await RemindModel.findOne(
      {
        guildId: guildId,
        type: type,
        timestamp: { $gt: new Date(), $lte: timestamp },
      },
      {},
    );
  }

  private async createNewRemind(
    guildId: string,
    timestamp: Date,
    type: RemindType,
  ) {
    return await RemindModel.create({
      guildId,
      timestamp,
      type,
    });
  }
}
