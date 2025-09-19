import { Env } from "@fear/config";
import { type Guild, type GuildMember, type Message } from "discord.js";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { logger } from "#/libs/logger/logger.js";
import { RemindSystemMessage } from "#/messages/index.js";
import { BumpModel } from "#/models/bump.model.js";
import { BumpBanModel } from "#/models/bump-ban.model.js";
import { safePointConfig } from "#/models/points-settings.model.js";
import {
  type SettingsDocument,
  SettingsModel,
} from "#/models/settings.model.js";

import {
  BumpBanLimit,
  DefaultTimezone,
  getCommandByRemindType,
  MonitoringBot,
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
    private scheduleManager: ReminderScheduleManager,
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

      const settings = await SettingsModel.findOne(
        {
          guildId,
        },
        {},
        { upsert: true },
      );

      await this.scheduleManager.remind({ settings, ...payload });

      if (Env.AppEnv == "dev") {
        return await this.handleSuccess(message, payload, settings);
      }

      return (
        payload.success &&
        (await this.handleSuccess(message, payload, settings))
      );
    } catch (err) {
      logger.error(err);
    }
  }

  private async handleSuccess(
    message: Message,
    { type }: ParserValue,
    settings: SettingsDocument,
  ) {
    const existed = await BumpModel.findOne({ messageId: message.id });

    if (existed) {
      return;
    }

    const GMTNow = DateTime.now().setZone(DefaultTimezone);
    const nowHours = GMTNow.hour;
    const guild = message.guild;
    const user = message.interactionMetadata.user;

    const pointConfig = await safePointConfig(message.guildId, type);

    let points = pointConfig.default;

    if (nowHours >= 0 && nowHours <= 7) {
      points += pointConfig.bonus;
    }

    await BumpModel.create({
      guildId: guild.id,
      executorId: user.id,
      messageId: message.id,
      points: points,
      type,
    });

    if (type === RemindType.ServerMonitoring) {
      const member = await guild.members.fetch(user.id).catch(() => null);
      try {
        await this.handleBumpBan(member, guild, type, settings);
      } catch (err) {
        logger.error("Ошибка выдачи бамп бана", err);
      }
    }

    const embed = new EmbedBuilder()
      .setDefaults(user)
      .setTitle(RemindSystemMessage.monitoring.embed.title)
      .setDescription(
        RemindSystemMessage.monitoring.embed.description(
          points,
          getCommandByRemindType(type),
        ),
      );

    return message.reply({
      embeds: [embed],
    });
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

    if (bumpBanRole) {
      await member.roles.add(bumpBanRole).catch(logger.error);
    }

    if (bumpBan?.removeIn + 1 >= BumpBanLimit) {
      await BumpBanModel.deleteOne({ _id: bumpBan._id });
      if (bumpBanRole) {
        await member.roles.remove(bumpBanRole).catch(logger.error);
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
}
