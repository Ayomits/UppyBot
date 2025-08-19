import { LocalCache } from "@ts-fetcher/cache";
import {
  type Guild,
  type Snowflake,
  type TextChannel,
  type User,
} from "discord.js";
import type { Client } from "discordx";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { isJsonDifferent } from "#/libs/json/diff.js";
import { ScheduleManager } from "#/libs/schedule/schedule.manager.js";
import { HelperBotMessages } from "#/messages/index.js";
import { type RemindDocument, RemindModel } from "#/models/remind.model.js";
import {
  type SettingsDocument,
  SettingsModel,
} from "#/models/settings.model.js";

import {
  DefaultTimezone,
  getBotByRemindType,
  getCommandByRemindType,
  MonitoringCooldownHours,
  type RemindType,
} from "./reminder.const.js";

type RemindCache = {
  settings: SettingsDocument;
  remind: RemindDocument;
};

type RemindOptions = {
  guild: Guild;
  remind: RemindDocument;
  settings: SettingsDocument;
  shouldReveal?: boolean;
};

@injectable()
export class ReminderScheduleManager {
  private activeReminds: LocalCache<string, RemindCache>;

  constructor(
    @inject(ScheduleManager) private scheduleManager: ScheduleManager
  ) {
    this.activeReminds = new LocalCache();
  }

  public async initReminds(client: Client) {
    const { entriesMap, guilds } = await this.fetchRemindData(client);
    const promises = Object.entries(entriesMap).map(([, entry]) =>
      this.remind({
        guild: guilds.get(entry.remind.guildId),
        ...entry,
      })
    );

    await Promise.all(promises);

    this.scheduleManager.startPeriodJob("diff", 15_000, () =>
      this.diff(client)
    );
  }

  public async diff(client: Client) {
    const { entriesMap, guilds } = await this.fetchRemindData(client);
    const promises = Object.entries(entriesMap)
      .map(([, entry]) => {
        const activeRemind = this.activeReminds.get<RemindCache>(
          entry.remind.id
        );
        const isDiff =
          isJsonDifferent(entry.remind, activeRemind?.remind) ||
          isJsonDifferent(entry.settings, activeRemind?.settings) ||
          !activeRemind?.remind;

        if (isDiff) {
          return this.remind({
            guild: guilds.get(entry.remind.guildId),
            ...entry,
          });
        }
      })
      .filter(Boolean);

    await Promise.all(promises);
  }

  public async remind(options: RemindOptions) {
    const { guild, remind, settings, shouldReveal } = options;

    const validate = await this.validateRemind({ guild, remind, settings });

    if (!validate) {
      return;
    }

    const { channel, bot } = validate;

    const commonId = this.generateCommonId(guild.id, remind.type);
    const forceId = this.generateForceId(guild.id, remind.type);

    const currentTime = DateTime.now().setZone(DefaultTimezone).toJSDate();
    const timestampTime = DateTime.fromJSDate(remind.timestamp)
      .setZone(DefaultTimezone)
      .toJSDate();

    const currentTimeMilis = currentTime.getTime();
    const timestampTimeMilis = timestampTime.getTime();

    const remindArgs: Parameters<typeof this.sendRemind> = [
      channel,
      settings.bumpRoleIds,
      remind.type as RemindType,
      bot.user,
    ];

    const addActiveRemindArgs: Parameters<typeof this.activeReminds.set> = [
      remind.id,
      {
        remind,
        settings,
      },
      Infinity,
      () => {
        this.scheduleManager.stopJob(commonId);
        this.scheduleManager.stopJob(forceId);
      },
    ];

    let isPastRemind = false;

    if (currentTimeMilis > timestampTimeMilis) {
      const diff = (currentTimeMilis - timestampTimeMilis) / 1_000;

      if (Math.floor(diff / 3_600) >= MonitoringCooldownHours) {
        await this.updateRemindDb(remind.id);
        return this.sendWarning(...remindArgs);
      }
      isPastRemind = true;
    }

    const existedCommon = this.scheduleManager.getJob(commonId);
    const existedForce = this.scheduleManager.getJob(forceId);

    if (!existedCommon || shouldReveal) {
      this.scheduleManager.updateJob(commonId, timestampTime, async () => {
        this.sendRemind(...remindArgs);
        await this.updateRemindDb(remind.id);
      });
    }

    if (
      (!existedForce || shouldReveal) &&
      settings.force > 0 &&
      settings.force < MonitoringCooldownHours * 3_600 &&
      !isPastRemind
    ) {
      const forceTime = DateTime.fromJSDate(timestampTime)
        .minus({ seconds: settings.force })
        .toJSDate();
      this.scheduleManager.updateJob(forceId, forceTime, () => {
        this.sendForce(settings.force, ...remindArgs);
      });
    }

    this.activeReminds.set(...addActiveRemindArgs);
  }

  private async validateRemind({
    guild,
    settings,
    remind,
  }: Omit<RemindOptions, "shouldReveal">) {
    const bot = await guild.members
      .fetch(getBotByRemindType(remind.type as RemindType))
      .catch(() => null);
    const channel = await guild.channels
      .fetch(settings?.pingChannelId)
      .catch(() => null);

    if (!bot) {
      await this.updateRemindDb(remind.id);
      this.deleteRemindCache(remind.id);
      return false;
    }

    if (!channel || !settings) {
      this.deleteRemindCache(remind.id);
      return false;
    }
    return {
      bot,
      channel,
    };
  }

  private async updateRemindDb(id: string) {
    return await RemindModel.updateOne({ _id: id }, { isSended: true });
  }

  private async deleteRemindCache(id: string) {
    this.activeReminds.delete(id);
  }

  private async fetchRemindData(client: Client) {
    const guilds = client.guilds.cache;
    const guildIds = guilds.map((guild) => guild.id);

    const [settings, reminds] = await Promise.all([
      await SettingsModel.find({ guildId: { $in: guildIds } }),
      await RemindModel.find({ guildId: { $in: guildIds }, isSended: false }),
    ]);

    const settingsMap = Object.fromEntries(settings.map((s) => [s.guildId, s]));

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

  private generateCommonId(guildId: string, remindType: RemindType | number) {
    return `${guildId}-${remindType}-remind`;
  }

  private generateForceId(...args: Parameters<typeof this.generateCommonId>) {
    return this.generateCommonId(...args) + "-force";
  }

  private async sendRemind(
    channel: TextChannel,
    pings: Snowflake[],
    type: RemindType,
    bot: User
  ) {
    const embed = new EmbedBuilder()
      .setDefaults(bot)
      .setTitle(HelperBotMessages.remind.ping.embed.title)
      .setDescription(HelperBotMessages.remind.ping.embed.description);

    setTimeout(() => {
      channel
        .send({
          content: HelperBotMessages.remind.ping.content(
            pings,
            getCommandByRemindType(type)
          ),
          embeds: [embed],
        })
        .catch(console.error);
    }, 500);
  }

  private async sendWarning(...args: Parameters<typeof this.sendRemind>) {
    const [channel, pings, type] = args;
    setTimeout(() => {
      channel
        .send({
          content: HelperBotMessages.remind.warning.content(
            pings,
            getCommandByRemindType(type)
          ),
        })
        .catch(console.error);
    }, 500);
  }

  private async sendForce(
    force: number,
    ...args: Parameters<typeof this.sendRemind>
  ) {
    const [channel, pings, type] = args;
    setTimeout(() => {
      channel
        .send({
          content: HelperBotMessages.remind.force.content(
            pings,
            getCommandByRemindType(type),
            force
          ),
        })
        .catch(console.error);
    }, 500);
  }
}
