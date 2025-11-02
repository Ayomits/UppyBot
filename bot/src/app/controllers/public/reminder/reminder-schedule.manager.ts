import type { Guild, MessageCreateOptions } from "discord.js";
import type { Client } from "discordx";
import { DateTime } from "luxon";
import { injectable } from "tsyringe";

import { scheduleManager } from "#/libs/schedule/schedule.manager.js";
import { type RemindDocument, RemindModel } from "#/models/remind.model.js";
import {
  type SettingsDocument,
  SettingsModel,
} from "#/models/settings.model.js";

import { UppyRemindSystemMessage } from "../../../messages/remind-system.message.js";
import {
  getCommandIdByRemindType,
  getCommandNameByRemindType,
  MonitoringType,
} from "./reminder.const.js";
import type { ParserValue } from "./reminder.parser.js";

@injectable()
export class ReminderScheduleManager {
  async initReminds(client: Client) {
    const { entriesMap, guilds } = await this.fetchRemindData(client);
    const promises = Object.entries(entriesMap).map(([, entry]) =>
      this.remind.bind(this)({
        guild: guilds.get(entry.remind?.guildId),
        timestamp: entry.remind?.timestamp,
        settings: entry.settings,
        type: entry.remind?.type as MonitoringType,
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
  }: Omit<ParserValue, "authorId" | "success"> & {
    settings: SettingsDocument;
  }) {
    if (!guild) {
      return;
    }

    if (!settings) {
      settings = await SettingsModel.create({ guildId: guild.id });
    }

    if (!settings?.remind.enabled) {
      return;
    }

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
      settings?.force?.seconds > 0 &&
      GMTTimestamp.minus({ second: settings?.force?.seconds }).toMillis() >
        GMTCurrent.toMillis() &&
      !forceSchedule;

    const shouldStartCommon = !settings?.force?.useForceOnly && !commonSchedule;

    if (shouldStartCommon) {
      scheduleManager.updateJob(commonId, GMTTimestamp.toJSDate(), () =>
        this.sendCommonRemind(lastRemind, guild),
      );
    }

    if (shouldStartForce) {
      scheduleManager.updateJob(
        forceId,
        GMTTimestamp.minus({ seconds: settings?.force?.seconds }).toJSDate(),
        () => this.sendForceRemind(lastRemind, guild),
      );
    }
  }

  private generateCommonId(guildId: string, type: MonitoringType | number) {
    return `${guildId}-${type}-remind`;
  }

  private generateForceId(...args: Parameters<typeof this.generateCommonId>) {
    return this.generateCommonId(...args) + "-force";
  }

  public async forceRemindReplacement(
    guild: Guild,
    type: MonitoringType | number,
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
  }

  public async commonRemindReplacement(
    guild: Guild,
    type: MonitoringType | number,
  ) {
    const { id: guildId } = guild;
    const remind = await RemindModel.findOne({ guildId, type });

    if (!remind) {
      return;
    }

    const forceId = this.generateForceId(guildId, type);

    this.commonRemindDeletion(guildId, type);
    scheduleManager.startOnceJob(forceId, remind?.timestamp, () =>
      this.sendCommonRemind(remind, guild),
    );
  }

  public commonRemindDeletion(guildId: string, type: MonitoringType | number) {
    scheduleManager.stopJob(this.generateCommonId(guildId, type));
  }

  public deleteAllCommonRemind(guildId: string) {
    Object.values(MonitoringType).forEach((v) =>
      this.commonRemindDeletion(guildId, v),
    );
  }

  public forceRemindDeletion(guildId: string, type: MonitoringType | number) {
    scheduleManager.stopJob(this.generateForceId(guildId, type));
  }

  public deleteAllForceRemind(guildId: string) {
    Object.values(MonitoringType).forEach((v) =>
      this.forceRemindDeletion(guildId, v),
    );
  }

  public deleteAll(guildId: string) {
    this.deleteAllCommonRemind(guildId);
    this.deleteAllForceRemind(guildId);
  }

  private async sendCommonRemind(remind: RemindDocument, guild: Guild) {
    this.sendRemind(remind, guild, (_, settings) => ({
      content: UppyRemindSystemMessage.remind.ping.content(
        settings?.roles.pingRoles ?? [],
        getCommandNameByRemindType(remind.type)!,
        getCommandIdByRemindType(remind.type)!,
      ),
    }));
  }

  private async sendForceRemind(remind: RemindDocument, guild: Guild) {
    this.sendRemind(remind, guild, (_, settings) => ({
      content: UppyRemindSystemMessage.remind.force.content(
        settings?.roles.pingRoles ?? [],
        getCommandNameByRemindType(remind.type)!,
        getCommandIdByRemindType(remind.type)!,
        settings?.force?.seconds,
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
    const settings = await SettingsModel.findOneAndUpdate(
      { guildId: guild.id },
      {},
      { upsert: true },
    );

    const channel = await guild.channels
      .fetch(settings?.channels.pingChannelId ?? "")
      .catch(() => null);

    if (!channel) {
      return;
    }

    if (channel?.isSendable()) {
      try {
        channel?.send(message(remind, settings!));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
