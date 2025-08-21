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
import { BumpBanModel } from "#/models/bump-ban.model.js";
import { type RemindDocument, RemindModel } from "#/models/remind.model.js";
import {
  type SettingsDocument,
  SettingsModel,
} from "#/models/settings.model.js";

import {
  BumpBanCheckerInterval,
  BumpBanLimit,
  DefaultTimezone,
  DiffCheckerInterval,
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
    @inject(ScheduleManager) private scheduleManager: ScheduleManager,
  ) {
    this.activeReminds = new LocalCache();
  }

  public async initReminds(client: Client) {
    const { entriesMap, guilds } = await this.fetchRemindData(client);
    const promises = Object.entries(entriesMap).map(([, entry]) =>
      this.createRemind({
        guild: guilds.get(entry.remind.guildId),
        ...entry,
      }),
    );

    await Promise.all(promises);

    this.scheduleManager.startPeriodJob("diff", DiffCheckerInterval, () =>
      this.handleDiff(client),
    );
  }

  public async initBumpBan(client: Client) {
    await this.handleBumpBan(client);
    this.scheduleManager.startPeriodJob(
      "bump-ban",
      BumpBanCheckerInterval,
      () => {
        this.handleBumpBan(client);
      },
    );
  }

  private async handleBumpBan(client: Client) {
    const guilds = client.guilds.cache;
    const ids = guilds.map((guild) => guild.id);

    const bumpModelFilter = {
      guildId: { $in: ids },
      removeIn: { $gte: BumpBanLimit },
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
          .catch(console.error),
      ]);

      if (role && member) {
        member.roles.remove(role).catch(console.error);
      }
    }

    await BumpBanModel.deleteMany(bumpModelFilter);
  }

  private async handleDiff(client: Client) {
    const { entriesMap, guilds } = await this.fetchRemindData(client);
    const promises = Object.entries(entriesMap).map(async ([, entry]) => {
      const activeRemind = this.activeReminds.get<RemindCache>(entry.remind.id);
      const isDiff =
        typeof activeRemind?.remind === "undefined" ||
        isJsonDifferent(entry.remind, activeRemind?.remind) ||
        isJsonDifferent(entry.settings, activeRemind?.settings);

      if (isDiff) {
        await this.createRemind({
          guild: guilds.get(entry.remind.guildId),
          ...entry,
        });
      }
    });

    await Promise.all(promises);
  }

  public async createRemind(options: RemindOptions) {
    const { guild, remind, settings, shouldReveal } = options;

    const validate = await this.validateRemind({ guild, remind, settings });
    const activeRemind = this.activeReminds.get(remind.id);

    if (!validate) {
      return;
    }

    const { channel, bot } = validate;

    const commonId = this.generateCommonId(guild.id, remind.type);
    const forceId = this.generateForceId(guild.id, remind.type);

    const existedCommon = this.scheduleManager.getJob(commonId);
    const existedForce = this.scheduleManager.getJob(forceId);

    if ((existedCommon || existedForce || activeRemind) && !shouldReveal) {
      return;
    }

    if (shouldReveal) {
      this.scheduleManager.stopJob(commonId);
      this.scheduleManager.stopJob(forceId);
    }

    const currentTime = DateTime.now().setZone(DefaultTimezone);
    const dbTime = DateTime.fromJSDate(remind.timestamp).setZone(
      DefaultTimezone,
    );

    async function cleanup() {
      this.deleteRemindCache(remind.id);
      await this.updateRemindDb(remind.id);
    }

    if (currentTime >= dbTime) {
      const [currMilis, dbMilis] = [currentTime.toMillis(), dbTime.toMillis()];

      const hours = Math.floor((currMilis - dbMilis) / 3_600);
      const diff = Math.min(Math.max(hours, 0), MonitoringCooldownHours);

      this.scheduleManager.stopJob(commonId);
      this.scheduleManager.stopJob(forceId);

      await cleanup.bind(this)();

      if (diff >= MonitoringCooldownHours) {
        return this.sendWarn(channel, settings.bumpRoleIds, remind.type, bot);
      }
      return this.sendRemind(channel, settings.bumpRoleIds, remind.type, bot);
    }

    this.scheduleManager.startOnceJob(commonId, dbTime.toJSDate(), async () => {
      await cleanup.bind(this)();
      this.sendRemind(channel, settings.bumpRoleIds, remind.type, bot);
    });

    if (
      settings.force > 0 &&
      settings.force < MonitoringCooldownHours * 3_600
    ) {
      this.scheduleManager.startOnceJob(
        forceId,
        dbTime.minus({ seconds: settings.force }).toJSDate(),
        async () => {
          await cleanup.bind(this)();
          this.sendForce(
            settings.force,
            channel,
            settings.bumpRoleIds,
            remind.type,
            bot,
          );
        },
      );
    }
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

  private deleteRemindCache(id: string) {
    this.activeReminds.delete(id);
  }

  private async fetchRemindData(client: Client) {
    const guilds = client.guilds.cache;
    const guildIds = guilds.map((guild) => guild.id);

    const [settings, reminds] = await Promise.all([
      await SettingsModel.find({ guildId: { $in: guildIds } }),
      await RemindModel.find({
        guildId: { $in: guildIds },
        isSended: false,
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

  private generateCommonId(guildId: string, remindType: RemindType | number) {
    return `${guildId}-${remindType}-remind`;
  }

  private generateForceId(...args: Parameters<typeof this.generateCommonId>) {
    return this.generateCommonId(...args) + "-force";
  }

  private async sendRemind(
    channel: TextChannel,
    pings: Snowflake[],
    type: RemindType | number,
    bot: User,
  ) {
    const embed = new EmbedBuilder()
      .setDefaults(bot)
      .setTitle(HelperBotMessages.remind.ping.embed.title)
      .setDescription(HelperBotMessages.remind.ping.embed.description);

    channel
      ?.send({
        content: HelperBotMessages.remind.ping.content(
          pings,
          getCommandByRemindType(type),
        ),
        embeds: [embed],
      })
      .catch(console.error);
  }

  private async sendWarn(...args: Parameters<typeof this.sendRemind>) {
    const [channel, pings, type] = args;

    channel
      ?.send({
        content: HelperBotMessages.remind.warning.content(
          pings,
          getCommandByRemindType(type),
        ),
      })
      .catch(console.error);
  }

  private async sendForce(
    force: number,
    ...args: Parameters<typeof this.sendRemind>
  ) {
    const [channel, pings, type] = args;

    channel
      ?.send({
        content: HelperBotMessages.remind.force.content(
          pings,
          getCommandByRemindType(type),
          force,
        ),
      })
      .catch(console.error);
  }
}
