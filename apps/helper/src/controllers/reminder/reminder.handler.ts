import {
  type Guild,
  type GuildMember,
  type Message,
  userMention,
} from "discord.js";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { HelperBotMessages } from "#/messages/index.js";
import { BumpModel } from "#/models/bump.model.js";
import { BumpBanModel } from "#/models/bump-ban.model.js";
import { RemindModel } from "#/models/remind.model.js";
import {
  type SettingsDocument,
  SettingsModel,
} from "#/models/settings.model.js";

import {
  BumpBanLimit,
  DefaultTimezone,
  getCommandByRemindType,
  MonitoringBot,
  PointsRate,
  RemindType,
} from "./reminder.const.js";
import { type ParserValue, ReminderParser } from "./reminder.parser.js";
import { ReminderScheduleManager } from "./reminder.schedule-manager.js";

@injectable()
/**
 * Класс для реагирования на команды от мониторингов
 * Умеет обрабатывать случаи, когда какие-то шаловливые ручки полезли в базу
 */
export class ReminderHandler {
  constructor(
    @inject(ReminderParser) private commandParser: ReminderParser,
    @inject(ReminderScheduleManager)
    private reminderSchedule: ReminderScheduleManager,
  ) {}

  public async handleCommand(message: Message) {
    try {
      if (
        !Object.values(MonitoringBot).includes(
          message.author.id as MonitoringBot,
        )
      ) {
        return;
      }

      const payload = this.commandParser.handleMonitoring(message);

      const guildId = message.guildId;

      if (!payload) {
        return;
      }

      let remind = await this.fetchLastRemind(guildId, payload.type);

      const settings = await SettingsModel.findOne(
        {
          guildId,
        },
        {},
        { upsert: true },
      );

      if (payload.success && remind) {
        await RemindModel.deleteOne({ _id: remind._id });
        remind = null;
      }

      if (payload.success || !remind) {
        remind = await this.createRemind(
          guildId,
          payload.timestamp,
          payload.type,
        );
      }

      const GMTpayload = DateTime.fromJSDate(payload.timestamp)
        .setZone(DefaultTimezone)
        .toJSDate();

      const GMTTime = DateTime.fromJSDate(remind.timestamp)
        .setZone(DefaultTimezone)
        .toJSDate();

      const isAnomaly = GMTTime.getTime() != GMTpayload.getTime();

      if (isAnomaly) {
        remind = await this.updateAnomaly(remind._id, payload.timestamp);
      }

      await this.reminderSchedule.remind({
        guild: message.guild,
        remind,
        settings,
      });

      return await this.handleSuccess(message, payload, settings);
    } catch (err) {
      console.error(err);
    }
  }

  private async createRemind(
    guildId: string,
    timestamp: Date,
    type: RemindType,
  ) {
    return await RemindModel.create({
      guildId,
      timestamp,
      type,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async updateAnomaly(objectId: any, timestamp: Date) {
    return await RemindModel.findOneAndUpdate(
      { _id: objectId },
      { timestamp },
      { new: true },
    );
  }

  private async fetchLastRemind(guildId: string, type: RemindType) {
    return await RemindModel.findOne({
      guildId,
      type,
      isSended: false,
    }).sort({ timestamp: -1 });
  }

  private async handleBumpBan(
    member: GuildMember,
    guild: Guild,
    type: RemindType,
    settings: SettingsDocument,
  ) {
    const bumpBanRole = await guild.roles
      .fetch(settings.bumpBanRoleId)
      .catch(() => null);

    const bumpBan = await BumpBanModel.findOneAndUpdate(
      { guildId: guild.id, userId: member.id, type },
      {},
      { upsert: true },
    );

    if (bumpBan.removeIn === 0 && bumpBanRole) {
      member.roles.add(bumpBanRole).catch(console.error);
    }

    if (bumpBan?.removeIn + 1 >= BumpBanLimit) {
      await BumpBanModel.deleteOne({ _id: bumpBan._id });
      if (bumpBanRole) {
        member.roles.remove(bumpBanRole).catch(console.error);
      }
    }

    await BumpBanModel.updateMany(
      {
        guildId: guild.id,
        userId: { $ne: member.id },
      },
      {
        $inc: {
          removeIn: 1,
        },
      },
    );
  }

  private async handleSuccess(
    message: Message,
    payload: ParserValue,
    settings: SettingsDocument,
  ) {
    const { type } = payload;
    let points: number = PointsRate[type];
    const guild = message.guild;
    const user = message.interactionMetadata.user;

    if (type === RemindType.ServerMonitoring) {
      const member = await guild.members.fetch(user.id).catch(() => null);
      await this.handleBumpBan(member, guild, payload.type, settings);
    }

    const GMTNow = DateTime.now().setZone(DefaultTimezone);
    const nowHours = GMTNow.hour;

    if (nowHours >= 0 && nowHours <= 8) {
      points += PointsRate.night;
    }

    await BumpModel.create({
      guildId: guild.id,
      executorId: user.id,
      points: points,
      type,
    });

    const embed = new EmbedBuilder()
      .setDefaults(user)
      .setTitle(HelperBotMessages.monitoring.embed.title)
      .setDescription(
        HelperBotMessages.monitoring.embed.description(
          points,
          getCommandByRemindType(type),
        ),
      );

    return message.reply({
      content: userMention(user.id),
      embeds: [embed],
    });
  }
}
