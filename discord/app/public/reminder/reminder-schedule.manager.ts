import type { Guild } from "discord.js";
import type { Client } from "discordx";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import { appEventEmitter } from "#/discord/events/emitter.js";
import type { AppRemindExecute } from "#/discord/events/types.js";
import { type SettingsDocument } from "#/shared/db/models/uppy-discord/settings.model.js";
import { RemindRepository } from "#/shared/db/repositories/uppy-discord/remind.repository.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { logger } from "#/shared/libs/logger/index.js";
import { scheduleManager } from "#/shared/libs/schedule/schedule.manager.js";

import {
  getBotByRemindType,
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

    const remind = await this.remindRepository.findOrCreate(
      guild.id,
      type,
      timestamp!,
    );

    if (DateTime.now().toMillis() >= remind.timestamp!.getTime()) {
      return;
    }

    await this.setupRemindSchedules(guild, remind, settings, type);
    return remind;
  }

  private async setupRemindSchedules(
    guild: Guild,
    remind: Awaited<ReturnType<RemindRepository["findOrCreate"]>>,
    settings: SettingsDocument,
    type: number,
  ) {
    const { id: guildId, name: guildName } = guild;
    const remindTimestamp = DateTime.fromJSDate(remind.timestamp!);
    const currentTimestamp = DateTime.now();

    const commonId = this.generateId(guildId, type);
    const forceId = this.generateId(guildId, type, "force");

    const forceSeconds = settings?.force?.seconds;
    const useForceOnly = settings?.force?.useForceOnly;

    const shouldStartForce =
      forceSeconds > 0 &&
      remindTimestamp.minus({ seconds: forceSeconds }).toMillis() >
        currentTimestamp.toMillis() &&
      !scheduleManager.getJob(forceId);

    const shouldStartCommon =
      !useForceOnly && !scheduleManager.getJob(commonId);

    const remindData = {
      type,
      guildId,
      settings,
      timestamp: remind.timestamp!,
    };

    if (shouldStartCommon) {
      this.logRemindStart(type, guildName, "common");
        this.sendRemind(remindData, "common")
    }

    if (shouldStartForce) {
      this.logRemindStart(type, guildName, "force");
      scheduleManager.updateJob(
        forceId,
        remindTimestamp.minus({ seconds: forceSeconds }).toJSDate(),
        () => this.sendRemind(remindData, "force"),
      );
    }
  }

  private logRemindStart(
    type: number,
    guildName: string,
    scheduleType: "force" | "common",
  ) {
    logger.info(
      `${scheduleType === "force" ? "Force" : "Common"} remind /${getCommandNameByRemindType(type)} (${getBotByRemindType(type)}) started for guild: ${guildName}`,
    );
  }

  private generateId(
    guildId: string,
    type: MonitoringType | number,
    suffix?: string,
  ) {
    return `${guildId}-${type}-remind${suffix ? `-${suffix}` : ""}`;
  }

  public async handleRemindReplacement(
    guild: Guild,
    type: MonitoringType | number,
    options: { force?: number; mode: "force" | "common" },
  ) {
    const { id: guildId } = guild;
    const remind = await this.remindRepository.findRemind(guildId, type);
    const settings = await this.settingsRepository.findGuildSettings(guildId);

    if (!remind) {
      return;
    }

    const suffix = options.mode === "force" ? "force" : undefined;
    const scheduleId = this.generateId(guildId, type, suffix);

    this.deleteRemind(guildId, type, options.mode);

    const timestamp = options.force
      ? DateTime.fromJSDate(remind.timestamp)
          .minus({ seconds: options.force })
          .toJSDate()
      : remind.timestamp;

    scheduleManager.startOnceJob(scheduleId, timestamp, () =>
      this.sendRemind(
        {
          type,
          guildId,
          settings,
          timestamp: remind.timestamp!,
        },
        options.mode,
      ),
    );
  }

  public deleteRemind(
    guildId: string,
    type: MonitoringType | number,
    mode?: "force" | "common",
  ) {
    if (mode) {
      scheduleManager.stopJob(
        this.generateId(guildId, type, mode === "force" ? "force" : undefined),
      );
    } else {
      scheduleManager.stopJob(this.generateId(guildId, type));
      scheduleManager.stopJob(this.generateId(guildId, type, "force"));
    }
  }

  public deleteAllReminds(guildId: string, mode?: "force" | "common") {
    const types = Object.values(MonitoringType);

    if (mode) {
      types.forEach((type) => this.deleteRemind(guildId, type, mode));
    } else {
      types.forEach((type) => this.deleteRemind(guildId, type));
    }
  }

  private sendRemind(payload: AppRemindExecute, type: "force" | "common") {
    appEventEmitter.emit(`remind:${type}`, payload);
  }
}
