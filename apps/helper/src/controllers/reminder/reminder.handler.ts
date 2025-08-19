import type { Message } from "discord.js";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import { RemindModel } from "#/models/remind.model.js";
import { SettingsModel } from "#/models/settings.model.js";

import {
  DefaultTimezone,
  MonitoringBot,
  type RemindType,
} from "./reminder.const.js";
import { ReminderParser } from "./reminder.parser.js";
import { ReminderScheduleManager } from "./reminder.schedule-manager.js";

@injectable()
/**
 * Класс для реагирования на команды от мониторингов
 * Умеет обрабатывать случаи, когда какие-то шаловливые ручки полезли в базу
 */
export class ReminderHandler {
  constructor(
    @inject(ReminderParser) private commandParser: ReminderParser,
    @inject(ReminderScheduleManager)
    private reminderSchedule: ReminderScheduleManager,
  ) {}

  public async handleCommand(message: Message) {
    try {
      if (
        !Object.values(MonitoringBot).includes(
          message.author.id as MonitoringBot,
        )
      ) {
        return;
      }

      const payload = this.commandParser.handleMonitoring(message);

      const guildId = message.guildId;
      // const authorId = message.author.id;

      if (!payload) {
        return;
      }

      let remind = await this.fetchLastRemind(guildId, payload.type);

      const settings = await SettingsModel.findOne(
        {
          guildId,
        },
        {},
        { upsert: true },
      );

      if (payload.success && remind) {
        await RemindModel.deleteOne({ _id: remind._id });
        remind = null;
      }

      if (payload.success || !remind) {
        remind = await this.createRemind(
          guildId,
          payload.timestamp,
          payload.type,
        );
      }

      const GMTpayload = DateTime.fromJSDate(payload.timestamp)
        .setZone(DefaultTimezone)
        .toJSDate();

      const GMTTime = DateTime.fromJSDate(remind.timestamp)
        .setZone(DefaultTimezone)
        .toJSDate();

      const isAnomaly = GMTTime.getTime() != GMTpayload.getTime();

      if (isAnomaly) {
        remind = await this.updateAnomaly(remind._id, payload.timestamp);
      }

      await this.reminderSchedule.remind({
        guild: message.guild,
        remind,
        settings,
      });

      return message.reply(JSON.stringify(remind));
    } catch (err) {
      console.error(err);
    }
  }

  private async createRemind(
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async updateAnomaly(objectId: any, timestamp: Date) {
    return await RemindModel.findOneAndUpdate(
      { _id: objectId },
      { timestamp },
      { new: true },
    );
  }

  private async fetchLastRemind(guildId: string, type: RemindType) {
    return await RemindModel.findOne({
      guildId,
      type,
      isSended: false,
    }).sort({ timestamp: -1 });
  }
}
