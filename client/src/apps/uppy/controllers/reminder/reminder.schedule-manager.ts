import type { Guild, MessageCreateOptions } from "discord.js";
import type { Client } from "discordx";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import { logger } from "#/libs/logger/logger.js";
import { scheduleManager } from "#/libs/schedule/schedule.manager.js";
import { BumpBanModel } from "#/models/bump-ban.model.js";
import { type RemindDocument, RemindModel } from "#/models/remind.model.js";
import {
  type SettingsDocument,
  SettingsModel,
} from "#/models/settings.model.js";

import { UppyRemindSystemMessage } from "../../messages/remind-system.message.js";
import { UppyLogService } from "../logging/log.service.js";
import {
  BumpBanCheckerInterval,
  BumpBanLimit,
  DefaultTimezone,
  getCommandIdByRemindType,
  getCommandNameByRemindType,
  type RemindType,
} from "./reminder.const.js";
import type { ParserValue } from "./reminder.parser.js";

@injectable()
export class ReminderScheduleManager {
  constructor(@inject(UppyLogService) private logService: UppyLogService) {}

  async initReminds(client: Client) {
    const { entriesMap, guilds } = await this.fetchRemindData(client);
    const promises = Object.entries(entriesMap).map(([, entry]) =>
      this.remind({
        guild: guilds.get(entry.remind.guildId),
        timestamp: entry.remind.timestamp,
        settings: entry.settings,
        type: entry.remind.type as RemindType,
      })
    );

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

    const settingsMap = Object.fromEntries(
      settings?.map((s) => [s.guildId, s])
    );

    const entriesMap = Object.fromEntries(
      bans.map((ban) => [
        `remind.guildId-${Math.random()}`,
        { ban, settings: settingsMap[ban.guildId] },
      ])
    );

    for (const [, entry] of Object.entries(entriesMap)) {
      const { ban, settings } = entry;
      const guild = guilds.get(entry.ban.guildId);

      const [member, role] = await Promise.all([
        guild.members.fetch(ban.userId).catch(() => null),
        guild.roles
          .fetch(settings?.bumpBanRoleId, { cache: true })
          .catch(() => null),
      ]);

      if (role && member) {
        const hasRole = member.roles.cache.has(role.id);
        if (ban.removeIn >= BumpBanLimit) {
          await this.logService.sendBumpBanRemovalLog(guild, member);
          if (hasRole) {
            member.roles.remove(role).catch(() => null);
          }
          continue;
        }

        if (ban.removeIn < BumpBanLimit) {
          if (!hasRole) {
            member.roles.add(role).catch(() => null);
            await this.logService.sendBumpBanRoleAddingLog(guild, member);
          }
        }
      }
    }

    await BumpBanModel.deleteMany({
      ...bumpModelFilter,
      removeIn: { $gte: BumpBanLimit },
    });
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

    const settingsMap = Object.fromEntries(
      settings?.map((s) => [s.guildId, s])
    );

    const entriesMap = Object.fromEntries(
      reminds.map((remind) => [
        `remind.guildId-${Math.random()}`,
        { remind, settings: settingsMap[remind.guildId] },
      ])
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
      `Идёт проверка для создания напоминания для бота ${getCommandNameByRemindType(type)}`
    );

    const commonId = this.generateCommonId(guild.id, type);
    const forceId = this.generateForceId(guild.id, type);

    const lastRemind = await RemindModel.findOneAndUpdate(
      { guildId: guild.id, type },
      { timestamp },
      { upsert: true, new: true }
    );

    const GMTTimestamp = DateTime.fromJSDate(lastRemind.timestamp).setZone(
      DefaultTimezone
    );
    const GMTCurrent = DateTime.now().setZone(DefaultTimezone);

    if (GMTCurrent.toMillis() >= GMTTimestamp.toMillis()) {
      logger.error(
        `Просроченное напоминие у бота ${getCommandNameByRemindType(type)}`
      );
      return;
    }

    const commonSchedule = scheduleManager.getJob(commonId);
    const forceSchedule = scheduleManager.getJob(forceId);

    if (!settings?.useForceOnly && !commonSchedule) {
      scheduleManager.startOnceJob(commonId, GMTTimestamp.toJSDate(), () =>
        this.sendCommonRemind(lastRemind, guild)
      );
      logger.success(
        `Напоминие для бота ${getCommandNameByRemindType(type)} создано`
      );
    }

    if (
      settings?.force > 0 &&
      GMTTimestamp.minus({ second: settings?.force }).toMillis() >
        GMTCurrent.toMillis() &&
      !forceSchedule
    ) {
      scheduleManager.startOnceJob(
        forceId,
        GMTTimestamp.minus({ seconds: settings?.force }).toJSDate(),
        () => this.sendForceRemind(lastRemind, guild)
      );

      logger.success(
        `Преждевременное напоминие для бота ${getCommandNameByRemindType(type)} создано`
      );
    }
  }

  private async sendCommonRemind(remind: RemindDocument, guild: Guild) {
    return this.sendRemind(remind, guild, (_, settings) => ({
      content: UppyRemindSystemMessage.remind.ping.content(
        settings?.bumpRoleIds,
        getCommandNameByRemindType(remind.type),
        getCommandIdByRemindType(remind.type)
      ),
    }));
  }

  private async sendForceRemind(remind: RemindDocument, guild: Guild) {
    return this.sendRemind(remind, guild, (_, settings) => ({
      content: UppyRemindSystemMessage.remind.force.content(
        settings?.bumpRoleIds,
        getCommandNameByRemindType(remind.type),
        getCommandIdByRemindType(remind.type),
        settings?.force
      ),
    }));
  }

  private async sendRemind(
    remind: RemindDocument,
    guild: Guild,
    message: (
      remind: RemindDocument,
      settings: SettingsDocument
    ) => MessageCreateOptions
  ) {
    logger.info("Начинаю высылать преждевременное напоминание");
    const settings = await SettingsModel.findOneAndUpdate(
      { guildId: guild.id },
      {},
      { upsert: true }
    );

    const channel = await guild.channels
      .fetch(settings?.pingChannelId)
      .catch(null);

    if (!channel) {
      return;
    }

    if (channel?.isSendable()) {
      try {
        channel?.send(message(remind, settings));
        logger.success(
          `Уведомление успешно выслано для бота ${getCommandNameByRemindType(remind.type)} в канал ${channel.name}`
        );
        // eslint-disable-next-line no-empty
      } catch {}
    }
  }

  private generateCommonId(guildId: string, type: RemindType | number) {
    return `${guildId}-${type}-remind`;
  }

  private generateForceId(...args: Parameters<typeof this.generateCommonId>) {
    return this.generateCommonId(...args) + "-force";
  }
}
