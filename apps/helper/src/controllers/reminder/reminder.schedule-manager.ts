import {
  Collection,
  type Guild,
  type GuildMember,
  type PartialGuildMember,
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
import { type RemindDocument, RemindModel } from "#/models/reminder.model.js";
import {
  type Settings,
  type SettingsDocument,
  SettingsModel,
} from "#/models/settings.model.js";

import {
  DefaultTimezone,
  getBotByRemindType,
  getCommandByRemindType,
  getRemindTypeByBot,
  MonitoringBot,
  type RemindType,
} from "./reminder.const.js";

@injectable()
export class ReminderScheduleManager {
  private settingsMap: Record<Snowflake, Settings> = {};
  private remindsMap: Record<string, RemindDocument> = {};

  constructor(
    @inject(ScheduleManager) private scheduleManager: ScheduleManager,
  ) {}

  public async handleGuildRemove(oldMember: PartialGuildMember | GuildMember) {
    if (Object.values(MonitoringBot).includes(oldMember?.id as MonitoringBot)) {
      const type = getRemindTypeByBot(oldMember.id as MonitoringBot);
      this.scheduleManager.stopJob(this.generateId(oldMember.guild.id, type));
    }
  }

  public async initReminds(client: Client) {
    const { reminds, remindsMap, settingsMap, guilds } =
      await this.getRemindInitData(client);
    for (const remind of reminds) {
      const guildId = remind.guildId;
      const remindFetched =
        remindsMap[this.generateId(guildId, remind.type as RemindType)];
      const settingsFetched = settingsMap[guildId];

      this.remind(guilds.get(guildId), remindFetched, settingsFetched);
    }

    this.scheduleManager.startPeriodJob("diff-equal", 60_000, () =>
      this.diff(client),
    );
  }

  public async diff(client: Client) {
    const { reminds, remindsMap, settingsMap, guilds } =
      await this.getRemindInitData(client);
    for (const remind of reminds) {
      const guildId = remind.guildId;
      const remindMapId = this.generateId(guildId, remind.type as RemindType);
      const remindFetched = remindsMap[remindMapId];
      const settingsFetched = settingsMap[guildId];
      const remindLocal = this.settingsMap[remindMapId];
      const settingsLocal = settingsMap[guildId];

      if (
        isJsonDifferent(remindFetched, remindLocal) ||
        isJsonDifferent(settingsFetched, settingsLocal)
      ) {
        this.remindsMap[remindMapId] = remindFetched;
        this.settingsMap[guildId] = settingsFetched;
        this.scheduleManager.stopJob(remindMapId);
        await this.remind(guilds.get(guildId), remindFetched, settingsFetched);
      }
    }
  }

  private async getRemindInitData(client: Client) {
    const oauthGuilds = await client.guilds.fetch();
    const guilds = new Collection<Snowflake, Guild>();
    for (const [, guild] of oauthGuilds) {
      guilds.set(guild.id, await guild.fetch());
    }
    const ids = guilds.map((guild) => guild.id);

    const [settings, reminds] = await Promise.all([
      SettingsModel.find({
        guildId: { $in: ids },
      }),
      RemindModel.find({
        guildId: { $in: ids },
      }),
    ]);

    const settingsMap = Object.fromEntries(settings.map((s) => [s.guildId, s]));
    const remindsMap = Object.fromEntries(
      reminds.map((r) => [this.generateId(r.guildId, r.type as RemindType), r]),
    );

    this.settingsMap = settingsMap;
    this.remindsMap = remindsMap;

    return {
      settings,
      settingsMap,
      reminds,
      remindsMap,
      guilds,
    };
  }

  public async remind(
    guild: Guild,
    remind: RemindDocument,
    settings?: SettingsDocument,
    deletePrevious = false,
  ) {
    try {
      const botId = getBotByRemindType(remind.type as RemindType);
      const members = await guild.members.fetch().catch(() => null);
      const channels = await guild.channels.fetch().catch(() => null);
      const bot = members.get(botId);
      const channel = channels.get(settings?.pingChannelId);

      if (!bot || !channel || !settings) {
        return await RemindModel.deleteOne({ _id: remind._id });
      }

      const timestamp = DateTime.fromJSDate(new Date(remind.timestamp))
        .setZone(DefaultTimezone)
        .toJSDate();

      if (
        DateTime.now().setZone(DefaultTimezone).toJSDate().getTime() >
        timestamp.getTime()
      ) {
        await RemindModel.deleteOne({ _id: remind._id });
        return this.sendWarning(
          channel as TextChannel,
          settings.bumpRoleIds,
          remind.type as RemindType,
          bot.user,
        );
      }

      const id = this.generateId(guild.id, remind.type as RemindType);

      let existedRemind = this.scheduleManager.getJob(id);

      if (deletePrevious) {
        this.scheduleManager.stopJob(id);
        existedRemind = null;
      }

      if (!existedRemind) {
        this.scheduleManager.startOnceJob(id, timestamp, () =>
          this.sendRemind(
            channel as TextChannel,
            settings.bumpRoleIds,
            remind.type as RemindType,
            bot.user,
          ),
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  private generateId(guildId: string, type: RemindType) {
    return `${guildId}-${type}-remind`;
  }

  private async sendRemind(
    channel: TextChannel,
    pings: Snowflake[],
    type: RemindType,
    bot: User,
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
            getCommandByRemindType(type),
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
            getCommandByRemindType(type),
          ),
        })
        .catch(console.error);
    }, 500);
  }
}
