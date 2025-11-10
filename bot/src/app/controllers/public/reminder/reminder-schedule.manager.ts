import {
  chatInputApplicationCommandMention,
  type Guild,
  type MessageCreateOptions,
  roleMention,
  type TextChannel,
  time,
  TimestampStyles,
} from "discord.js";
import type { Client } from "discordx";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import type { Remind } from "#/db/models/remind.model.js";
import { type SettingsDocument } from "#/db/models/settings.model.js";
import { RemindRepository } from "#/db/repositories/remind.repository.js";
import { SettingsRepository } from "#/db/repositories/settings.repository.js";
import { logger } from "#/libs/logger/logger.js";
import { scheduleManager } from "#/libs/schedule/schedule.manager.js";

import {
  getBotByRemindType,
  getCommandIdByRemindType,
  getCommandNameByRemindType,
  MonitoringType,
} from "./reminder.const.js";
import type { ParserValue } from "./reminder.parser.js";

@injectable()
export class ReminderScheduleManager {
  constructor(
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
    @inject(RemindRepository) private remindRepository: RemindRepository,
  ) {}

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
      this.settingsRepository.findMany({ guildId: { $in: guildIds } }),
      this.remindRepository.findMany({
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
      settings = await this.settingsRepository.findGuildSettings(guild.id);
    }

    if (!settings?.remind.enabled) {
      return;
    }

    const commonId = this.generateCommonId(guild.id, type);
    const forceId = this.generateForceId(guild.id, type);

    const currentTimestamp = DateTime.now();

    if (currentTimestamp.toMillis() >= timestamp!.getTime()) {
      return;
    }

    const remind = await this.remindRepository.findOrCreate(
      guild.id,
      type,
      timestamp!,
    );

    const remindTimestamp = DateTime.fromJSDate(remind.timestamp!);

    const commonSchedule = scheduleManager.getJob(commonId);
    const forceSchedule = scheduleManager.getJob(forceId);

    const shouldStartForce =
      settings?.force?.seconds > 0 &&
      remindTimestamp.minus({ second: settings?.force?.seconds }).toMillis() >
        currentTimestamp.toMillis() &&
      !forceSchedule;

    const shouldStartCommon = !settings?.force?.useForceOnly && !commonSchedule;

    if (shouldStartCommon) {
      logger.info(
        `Common remind /${getCommandNameByRemindType(type)} (${getBotByRemindType(type)}) started for guild: ${guild.name}`,
      );
      scheduleManager.updateJob(commonId, remindTimestamp.toJSDate(), () =>
        this.sendCommonRemind(remind, guild),
      );
    }

    if (shouldStartForce) {
      logger.info(
        `Force remind /${getCommandNameByRemindType(type)} (${getBotByRemindType(type)}) started for guild: ${guild.name}`,
      );
      scheduleManager.updateJob(
        forceId,
        remindTimestamp.minus({ seconds: settings?.force?.seconds }).toJSDate(),
        () => this.sendForceRemind(remind, guild),
      );
    }

    return remind;
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
    const remind = await this.remindRepository.findRemind(guildId, type);

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
    const remind = await this.remindRepository.findRemind(guildId, type);

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

  private async sendCommonRemind(remind: Remind, guild: Guild) {
    const commandName = getCommandNameByRemindType(remind.type)!;
    const commandId = getCommandIdByRemindType(remind.type)!;
    this.sendRemind(remind, guild, (_, settings) => ({
      content: `${settings.roles.pingRoles?.map(roleMention).join(" ")}, пора использовать команду ${chatInputApplicationCommandMention(commandName, commandId)}!`,
    }));
  }

  private async sendForceRemind(remind: Remind, guild: Guild) {
    const commandName = getCommandNameByRemindType(remind.type)!;
    const commandId = getCommandIdByRemindType(remind.type)!;
    this.sendRemind(remind, guild, (_, settings) => ({
      content: `${settings.roles.pingRoles?.map(roleMention).join(" ")}, команда ${chatInputApplicationCommandMention(commandName, commandId)} будет доступа ${time(Math.floor((Date.now() + settings.force!.seconds * 1_000) / 1_000), TimestampStyles.RelativeTime)}`,
    }));
  }

  private async sendRemind(
    remind: Remind,
    guild: Guild,
    message: (
      remind: Remind,
      settings: SettingsDocument,
    ) => MessageCreateOptions,
  ) {
    const settings = await this.settingsRepository.findGuildSettings(guild.id);

    const channel = await guild.channels
      .fetch(settings?.channels.pingChannelId ?? "")
      .catch(() => null);

    if (!channel) {
      return;
    }

    try {
      await (channel as TextChannel)?.send?.(message(remind, settings!));
      return true;
    } catch {
      return false;
    }
  }
}
