import type { Guild } from "discord.js";
import type { Client } from "discordx";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import { logger } from "#/libs/logger/logger.js";
import { ScheduleManager } from "#/libs/schedule/schedule.manager.js";
import { HelperBotMessages } from "#/messages/index.js";
import { type RemindDocument, RemindModel } from "#/models/remind.model.js";
import {
  type SettingsDocument,
  SettingsModel,
} from "#/models/settings.model.js";

import {
  DefaultTimezone,
  DiffCheckerInterval,
  getCommandByRemindType,
  type RemindType,
} from "./reminder.const.js";
import type { ParserValue } from "./reminder.parser.js";

@injectable()
export class ReminderScheduleManager {
  constructor(
    @inject(ScheduleManager) private scheduleManager: ScheduleManager,
  ) {}

  async initReminds(client: Client) {
    const { entriesMap, guilds } = await this.fetchRemindData(client);
    const promises = Object.entries(entriesMap).map(([, entry]) =>
      this.remind({
        guild: guilds.get(entry.remind.guildId),
        timestamp: entry.remind.timestamp,
        settings: entry.settings,
        type: entry.remind.type as RemindType,
      }),
    );

    await Promise.all(promises);

    this.scheduleManager.startPeriodJob("diff", DiffCheckerInterval, () =>
      this.handleDiff(client),
    );
  }

  async handleDiff(client: Client) {
    const { entriesMap, guilds } = await this.fetchRemindData(client);
    const promises = Object.entries(entriesMap).map(([, entry]) => {
      const { remind, settings } = entry;

      const commonId = this.generateCommonId(remind.guildId, remind.type);
      const forceId = this.generateForceId(remind.guildId, remind.type);

      const commonSchedule = this.scheduleManager.getJob(commonId);
      const forceSchedule = this.scheduleManager.getJob(forceId);

      const GMTCurrent = DateTime.now().setZone(DefaultTimezone).toMillis();
      const GMTTImestamp = DateTime.fromJSDate(remind.timestamp)
        .setZone(DefaultTimezone)
        .toMillis();

      if (GMTCurrent >= GMTTImestamp) {
        return;
      }

      const remindArgs: Parameters<typeof this.remind> = [
        {
          guild: guilds.get(remind.guildId),
          timestamp: remind.timestamp,
          settings,
          type: remind.type as RemindType,
        },
      ];

      if (commonSchedule || forceSchedule) {
        const GMTDate = DateTime.fromJSDate(commonSchedule.date)
          .setZone(DefaultTimezone)
          .toMillis();

        if (GMTTImestamp === GMTDate) {
          return;
        }

        if (settings.force <= 0) {
          this.scheduleManager.stopJob(forceId);
        }

        if (GMTTImestamp !== GMTDate) {
          this.scheduleManager.stopJob(commonId);
          this.scheduleManager.stopJob(forceId);
        }
      }

      logger.success(
        `Успешно применены новые изменения в базе данных для напоминания ${getCommandByRemindType(remind.type)}`,
      );
      return this.remind(...remindArgs);
    });

    await Promise.all(promises);
  }

  private async fetchRemindData(client: Client) {
    const guilds = client.guilds.cache;
    const guildIds = guilds.map((guild) => guild.id);

    const [settings, reminds] = await Promise.all([
      await SettingsModel.find({ guildId: { $in: guildIds } }),
      await RemindModel.find({
        guildId: { $in: guildIds },
      }),
    ]);

    const settingsMap = Object.fromEntries(settings.map((s) => [s.guildId, s]));

    const entriesMap = Object.fromEntries(
      reminds.map((remind) => [
        `remind.guildId-${Math.random()}`,
        { remind, settings: settingsMap[remind.guildId] },
      ]),
    );

    return {
      guilds,
      entriesMap,
    };
  }

  async remind({
    guild,
    settings,
    timestamp,
    type,
  }: Omit<ParserValue, "authorId" | "success"> & {
    settings: SettingsDocument;
  }) {
    logger.info(
      `Идёт проверка для создания напоминания для бота ${getCommandByRemindType(type)}`,
    );
    const commonId = this.generateCommonId(guild.id, type);
    const forceId = this.generateForceId(guild.id, type);
    const remind = await RemindModel.findOneAndUpdate(
      { guildId: guild.id, type },
      { timestamp },
      { upsert: true, new: true },
    );

    const GMTTimestamp = DateTime.fromJSDate(remind.timestamp).setZone(
      DefaultTimezone,
    );
    const GMTCurrent = DateTime.now().setZone(DefaultTimezone);

    if (GMTCurrent.toMillis() >= GMTTimestamp.toMillis()) {
      logger.error(
        `Просроченное напоминие у бота ${getCommandByRemindType(type)}`,
      );
      return;
    }

    const commonSchedule = this.scheduleManager.getJob(commonId);
    const forceSchedule = this.scheduleManager.getJob(forceId);

    if (commonSchedule || forceSchedule) {
      logger.warn(
        `Напоминие у бота ${getCommandByRemindType(type)} уже существует`,
      );
      return;
    }

    this.scheduleManager.startOnceJob(commonId, GMTTimestamp.toJSDate(), () =>
      this.sendCommonRemind(remind, guild),
    );
    logger.success(
      `Напоминие для бота ${getCommandByRemindType(type)} создано`,
    );
    if (settings.force > 0 && GMTTimestamp.toMillis() > GMTCurrent.toMillis()) {
      this.scheduleManager.startOnceJob(
        forceId,
        GMTTimestamp.minus({ seconds: settings.force }).toJSDate(),
        () => this.sendForceRemind(remind, guild),
      );

      logger.success(
        `Преждевременное напоминие для бота ${getCommandByRemindType(type)} создано`,
      );
    }
  }

  private async sendCommonRemind(remind: RemindDocument, guild: Guild) {
    const settings = await SettingsModel.findOneAndUpdate(
      { guildId: guild.id },
      {},
      { upsert: true },
    );
    const channel = await guild.channels
      .fetch(settings.pingChannelId)
      .catch(null);

    if (!channel) {
      return;
    }

    if (channel.isSendable()) {
      try {
        channel?.send({
          content: HelperBotMessages.remind.ping.content(
            settings.bumpRoleIds,
            getCommandByRemindType(remind.type),
          ),
        });
        logger.success(
          `Напоминание успешно выслано для бота ${getCommandByRemindType(remind.type)} в канал ${channel.name}`,
        );
      } catch (err) {
        logger.error(
          `Напоминание не было выслано для бота ${getCommandByRemindType(remind.type)} в канал ${channel.name}`,
          "Причина:",
          err,
        );
      }
    }
  }

  private async sendForceRemind(remind: RemindDocument, guild: Guild) {
    const settings = await SettingsModel.findOneAndUpdate(
      { guildId: guild.id },
      {},
      { upsert: true },
    );
    const channel = await guild.channels
      .fetch(settings.pingChannelId)
      .catch(null);

    if (!channel) {
      return;
    }

    if (channel.isSendable()) {
      try {
        channel?.send({
          content: HelperBotMessages.remind.force.content(
            settings.bumpRoleIds,
            getCommandByRemindType(remind.type),
            settings.force,
          ),
        });
        logger.success(
          `Преждевременное напоминание успешно выслано для бота ${getCommandByRemindType(remind.type)} в канал ${channel.name}`,
        );
      } catch (err) {
        logger.error(
          `Преждевременное напоминание не было выслано для бота ${getCommandByRemindType(remind.type)} в канал ${channel.name}`,
          "Причина:",
          err,
        );
      }
    }
  }

  private generateCommonId(guildId: string, type: RemindType | number) {
    return `${guildId}-${type}-remind`;
  }

  private generateForceId(...args: Parameters<typeof this.generateCommonId>) {
    return this.generateCommonId(...args) + "-force";
  }
}
