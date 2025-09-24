import type { Guild } from "discord.js";
import type { Client } from "discordx";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import { logger } from "#/libs/logger/logger.js";
import {
  type ScheduleCache,
  scheduleManager,
} from "#/libs/schedule/schedule.manager.js";
import { RemindSystemMessage } from "#/messages/index.js";
import { BumpBanModel } from "#/models/bump-ban.model.js";
import { type RemindDocument, RemindModel } from "#/models/remind.model.js";
import {
  type SettingsDocument,
  SettingsModel,
} from "#/models/settings.model.js";

import { LogService } from "../logging/log.service.js";
import {
  BumpBanCheckerInterval,
  BumpBanLimit,
  DefaultTimezone,
  DiffCheckerInterval,
  getCommandByRemindType,
  type RemindType,
} from "./reminder.const.js";
import type { ParserValue } from "./reminder.parser.js";

@injectable()
export class ReminderScheduleManager {
  constructor(@inject(LogService) private logService: LogService) {}

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

    scheduleManager.startPeriodJob("diff", DiffCheckerInterval, () =>
      this.handleDiff(client),
    );
  }

  async handleDiff(client: Client) {
    const { entriesMap, guilds } = await this.fetchRemindData(client);
    const promises = Object.entries(entriesMap).map(([, entry]) => {
      const { remind, settings } = entry;

      const commonId = this.generateCommonId(remind.guildId, remind.type);
      const forceId = this.generateForceId(remind.guildId, remind.type);

      const initCommonSchedule = scheduleManager.getJob(commonId);
      const initForceSchedule = scheduleManager.getJob(forceId);

      const GMTCurrent = DateTime.now().setZone(DefaultTimezone).toMillis();
      const GMTTImestamp = DateTime.fromJSDate(remind.timestamp).setZone(
        DefaultTimezone,
      );

      if (GMTCurrent >= GMTTImestamp.toMillis()) {
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

      if (
        (initCommonSchedule === null ||
          typeof initCommonSchedule === "undefined") &&
        !settings.useForceOnly
      ) {
        logger.info(
          `Нет напоминания для бота ${getCommandByRemindType(remind.type)}, создаю`,
        );
        return this.remind(...remindArgs);
      }

      if (initCommonSchedule && settings.useForceOnly) {
        logger.info(
          `Отменено напоминание для бота ${getCommandByRemindType(remind.type)}`,
        );
        scheduleManager.stopJob(commonId);
      }

      if (initForceSchedule && settings.force <= 0) {
        logger.info(
          `Отменено преждевременное напоминание для бота ${getCommandByRemindType(remind.type)}`,
        );
        scheduleManager.stopJob(forceId);
      }

      const commonSchedule = scheduleManager.getJob(commonId);
      const forceSchedule = scheduleManager.getJob(forceId);

      const isValidForceDiff =
        forceSchedule &&
        this.validateSchedule(
          forceSchedule,
          GMTTImestamp.minus({ seconds: settings.force }).toMillis(),
          forceId,
          commonId,
        );
      const isValidCommonDiff =
        commonSchedule &&
        this.validateSchedule(
          commonSchedule,
          GMTTImestamp.toMillis(),
          forceId,
          commonId,
        );

      if (isValidForceDiff || isValidCommonDiff) {
        logger.success(
          `Успешно применены новые изменения в базе данных для напоминания ${getCommandByRemindType(remind.type)}`,
        );
        return this.remind(...remindArgs);
      }
    });

    await Promise.all(promises);
  }

  public async initBumpBan(client: Client) {
    logger.info("Начата первая проверка бамп бана");
    await this.handleBumpBan(client);
    logger.info("Закончена первая проверка бамп бана");
    scheduleManager.startPeriodJob("bump-ban", BumpBanCheckerInterval, () => {
      this.handleBumpBan(client);
    });
    logger.info("Запущена задача проверки бамп бана");
  }

  private async handleBumpBan(client: Client) {
    const guilds = client.guilds.cache;
    const ids = guilds.map((guild) => guild.id);

    const bumpModelFilter = {
      guildId: { $in: ids },
    };

    const [bans, settings] = await Promise.all([
      BumpBanModel.find(bumpModelFilter),
      SettingsModel.find({
        guildId: { $in: ids },
      }),
    ]);

    const settingsMap = Object.fromEntries(settings.map((s) => [s.guildId, s]));

    const entriesMap = Object.fromEntries(
      bans.map((ban) => [
        `remind.guildId-${Math.random()}`,
        { ban, settings: settingsMap[ban.guildId] },
      ]),
    );

    for (const [, entry] of Object.entries(entriesMap)) {
      const { ban, settings } = entry;
      const guild = guilds.get(entry.ban.guildId);

      const [member, role] = await Promise.all([
        guild.members.fetch(ban.userId).catch(() => null),
        guild.roles
          .fetch(settings.bumpBanRoleId, { cache: true })
          .catch(() => null),
      ]);

      if (role && member) {
        const hasRole = member.roles.cache.has(role.id);
        if (ban.removeIn >= BumpBanLimit) {
          await this.logService.logBumpBanRemoval(guild, member);
          if (hasRole) {
            member.roles.remove(role).catch(() => null);
          }
          continue;
        }

        if (ban.removeIn < BumpBanLimit) {
          if (!hasRole) {
            member.roles.add(role).catch(() => null);
            await this.logService.logBumpBanRoleAdding(guild, member);
          }
        }
      }
    }

    await BumpBanModel.deleteMany({
      ...bumpModelFilter,
      removeIn: { $gte: BumpBanLimit },
    });
  }

  private validateSchedule(
    schedule: ScheduleCache,
    timestamp: number,
    forceId: string,
    commonId: string,
  ) {
    const GMTDate = DateTime.fromJSDate(schedule?.date)
      .setZone(DefaultTimezone)
      .toMillis();

    if (timestamp === GMTDate) {
      return false;
    }

    if (timestamp !== GMTDate) {
      scheduleManager.stopJob(commonId);
      scheduleManager.stopJob(forceId);
    }

    return true;
  }

  private async fetchRemindData(client: Client) {
    const guilds = client.guilds.cache;
    const guildIds = guilds.map((guild) => guild.id);

    const [settings, reminds] = await Promise.all([
      SettingsModel.find({ guildId: { $in: guildIds } }),
      RemindModel.find({
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

    const commonSchedule = scheduleManager.getJob(commonId);
    const forceSchedule = scheduleManager.getJob(forceId);

    if (!settings.useForceOnly && !commonSchedule) {
      scheduleManager.startOnceJob(commonId, GMTTimestamp.toJSDate(), () =>
        this.sendCommonRemind(remind, guild),
      );
      logger.success(
        `Напоминие для бота ${getCommandByRemindType(type)} создано`,
      );
    }

    if (
      settings.force > 0 &&
      GMTTimestamp.minus({ second: settings.force }).toMillis() >
        GMTCurrent.toMillis() &&
      !forceSchedule
    ) {
      scheduleManager.startOnceJob(
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
    logger.info("Начинаю высылать напоминание");
    const settings = await SettingsModel.findOneAndUpdate(
      { guildId: guild.id },
      {},
      { upsert: true },
    );
    const channel = await guild.channels
      .fetch(settings?.pingChannelId)
      .catch(() => null);

    if (!channel) {
      logger.error(
        `Указанный канал не был найден для сервера ${remind.guildId}`,
      );
      return;
    }

    if (channel?.isSendable()) {
      try {
        channel?.send({
          content: RemindSystemMessage.remind.ping.content(
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
    logger.info("Начинаю высылать преждевременное напоминание");
    const settings = await SettingsModel.findOneAndUpdate(
      { guildId: guild.id },
      {},
      { upsert: true },
    );
    const channel = await guild.channels
      .fetch(settings?.pingChannelId)
      .catch(null);

    if (!channel) {
      logger.error(
        `Указанный канал не был найден для сервера ${remind.guildId}`,
      );
      return;
    }

    if (channel?.isSendable()) {
      try {
        channel?.send({
          content: RemindSystemMessage.remind.force.content(
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
