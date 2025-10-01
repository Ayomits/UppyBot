import type { Guild, MessageCreateOptions } from "discord.js";
import type { Client } from "discordx";
import { DateTime } from "luxon";
import { injectable } from "tsyringe";

import { logger } from "#/libs/logger/logger.js";
import { scheduleManager } from "#/libs/schedule/schedule.manager.js";
import { type RemindDocument, RemindModel } from "#/models/remind.model.js";
import { RemindLogsModel } from "#/models/remind-logs.model.js";
import {
  type SettingsDocument,
  SettingsModel,
} from "#/models/settings.model.js";

import { UppyRemindSystemMessage } from "../../messages/remind-system.message.js";
import {
  getCommandIdByRemindType,
  getCommandNameByRemindType,
  type RemindType,
} from "./reminder.const.js";
import type { ParserValue } from "./reminder.parser.js";

@injectable()
export class ReminderScheduleManager {
  async initReminds(client: Client) {
    const { entriesMap, guilds } = await this.fetchRemindData(client);
    const promises = Object.entries(entriesMap).map(([, entry]) =>
      this.remind({
        guild: guilds.get(entry.remind.guildId),
        timestamp: entry.remind.timestamp,
        settings: entry.settings,
        type: entry.remind.type as RemindType,
        isStartup: true,
      }),
    );

    await Promise.all(promises);
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
      settings?.map((s) => [s.guildId, s]),
    );

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

  public async remind({
    guild,
    settings,
    timestamp,
    type,
    isStartup,
  }: Omit<ParserValue, "authorId" | "success"> & {
    settings: SettingsDocument;
    isStartup?: boolean;
  }) {
    const commonId = this.generateCommonId(guild.id, type);
    const forceId = this.generateForceId(guild.id, type);

    const lastRemind = await RemindModel.findOneAndUpdate(
      { guildId: guild.id, type },
      { timestamp },
      { upsert: true, new: true },
    );

    const GMTTimestamp = DateTime.fromJSDate(lastRemind.timestamp);
    const GMTCurrent = DateTime.now();

    if (GMTCurrent.toMillis() >= GMTTimestamp.toMillis()) {
      return;
    }

    const commonSchedule = scheduleManager.getJob(commonId);
    const forceSchedule = scheduleManager.getJob(forceId);

    const shouldStartForce =
      settings?.force > 0 &&
      GMTTimestamp.minus({ second: settings?.force }).toMillis() >
        GMTCurrent.toMillis() &&
      !forceSchedule;

    const shouldStartCommon = !settings?.useForceOnly && !commonSchedule;

    const logs = [];

    const createLogDoc = (isForce: boolean) => ({
      guildId: guild.id,
      timestamp,
      type,
      isForce,
    });

    if (shouldStartCommon) {
      scheduleManager.updateJob(commonId, GMTTimestamp.toJSDate(), () =>
        this.sendCommonRemind(lastRemind, guild),
      );
      logs.push(createLogDoc(false));
    }

    if (shouldStartForce) {
      scheduleManager.updateJob(
        forceId,
        GMTTimestamp.minus({ seconds: settings?.force }).toJSDate(),
        () => this.sendForceRemind(lastRemind, guild),
      );

      logs.push(createLogDoc(true));
    }

    if (logs.length > 0 && !isStartup) {
      await RemindLogsModel.insertMany(logs);
    }
  }

  private generateCommonId(guildId: string, type: RemindType | number) {
    return `${guildId}-${type}-remind`;
  }

  private generateForceId(...args: Parameters<typeof this.generateCommonId>) {
    return this.generateCommonId(...args) + "-force";
  }

  public async forceRemindReplacement(
    guild: Guild,
    type: RemindType | number,
    force: number,
  ) {
    const { id: guildId } = guild;
    const remind = await RemindModel.findOne({ guildId, type });

    if (!remind) {
      return;
    }

    const forceId = this.generateForceId(guildId, type);
    const timestamp = DateTime.fromJSDate(remind.timestamp)
      .minus({ seconds: force })
      .toJSDate();

    this.forceRemindDeletion(guildId, type);
    scheduleManager.startOnceJob(forceId, timestamp, () =>
      this.sendForceRemind(remind, guild),
    );

    await RemindLogsModel.create({
      guildId: guild.id,
      timestamp,
      type,
      isForce: true,
    });
  }

  public async commonRemindReplacement(
    guild: Guild,
    type: RemindType | number,
  ) {
    const { id: guildId } = guild;
    const remind = await RemindModel.findOne({ guildId, type });

    if (!remind) {
      return;
    }

    const forceId = this.generateForceId(guildId, type);

    this.commonRemindDeletion(guildId, type);
    scheduleManager.startOnceJob(forceId, remind?.timestamp, () =>
      this.sendForceRemind(remind, guild),
    );

    await RemindLogsModel.create({
      guildId: guild.id,
      timestamp: remind.timestamp,
      type,
      isForce: false,
    });
  }

  public commonRemindDeletion(guildId: string, type: RemindType | number) {
    scheduleManager.stopJob(this.generateCommonId(guildId, type));
  }

  public forceRemindDeletion(guildId: string, type: RemindType | number) {
    scheduleManager.stopJob(this.generateForceId(guildId, type));
  }

  private async sendCommonRemind(remind: RemindDocument, guild: Guild) {
    return this.sendRemind(remind, guild, (_, settings) => ({
      content: UppyRemindSystemMessage.remind.ping.content(
        settings?.bumpRoleIds,
        getCommandNameByRemindType(remind.type),
        getCommandIdByRemindType(remind.type),
      ),
    }));
  }

  private async sendForceRemind(remind: RemindDocument, guild: Guild) {
    return this.sendRemind(remind, guild, (_, settings) => ({
      content: UppyRemindSystemMessage.remind.force.content(
        settings?.bumpRoleIds,
        getCommandNameByRemindType(remind.type),
        getCommandIdByRemindType(remind.type),
        settings?.force,
      ),
    }));
  }

  private async sendRemind(
    remind: RemindDocument,
    guild: Guild,
    message: (
      remind: RemindDocument,
      settings: SettingsDocument,
    ) => MessageCreateOptions,
  ) {
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
      return;
    }

    if (channel?.isSendable()) {
      try {
        channel?.send(message(remind, settings));
        logger.success(
          `Уведомление успешно выслано для бота ${getCommandNameByRemindType(remind.type)} в канал ${channel.name}`,
        );
        // eslint-disable-next-line no-empty
      } catch {}
    }
  }
}
