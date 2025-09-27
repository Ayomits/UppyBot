import {
  ContainerBuilder,
  type Guild,
  type GuildMember,
  heading,
  HeadingLevel,
  type Message,
  MessageFlags,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import { DateTime } from "luxon";
import { inject, singleton } from "tsyringe";

import { UsersUtility } from "#/libs/embed/users.utility.js";
import { logger } from "#/libs/logger/logger.js";
import { BumpModel } from "#/models/bump.model.js";
import { BumpBanModel } from "#/models/bump-ban.model.js";
import { safePointConfig } from "#/models/points-settings.model.js";
import type { RemindDocument } from "#/models/remind.model.js";
import { RemindModel } from "#/models/remind.model.js";
import {
  type SettingsDocument,
  SettingsModel,
} from "#/models/settings.model.js";

import { UppyRemindSystemMessage } from "../../messages/remind-system.message.js";
import { LogService } from "../logging/log.service.js";
import {
  BumpBanLimit,
  DefaultTimezone,
  getCommandIdByRemindType,
  MonitoringBot,
  RemindType,
} from "./reminder.const.js";
import { type ParserValue, ReminderParser } from "./reminder.parser.js";
import { ReminderScheduleManager } from "./reminder.schedule-manager.js";

@singleton()
/**
 * Класс для реагирования на команды от мониторингов
 * Умеет обрабатывать случаи, когда какие-то шаловливые ручки полезли в базу
 */
export class ReminderHandler {
  constructor(
    @inject(ReminderParser) private commandParser: ReminderParser,
    @inject(ReminderScheduleManager)
    private scheduleManager: ReminderScheduleManager,
    @inject(LogService) private logService: LogService,
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

      const [settings, lastRemind] = await Promise.all([
        SettingsModel.findOne(
          {
            guildId,
          },
          {},
          { upsert: true },
        ),
        RemindModel.findOne({
          guildId,
          type: payload.type,
        }),
      ]);

      await this.scheduleManager.remind({ settings, ...payload });

      if (process.env.APP_ENV == "dev" || payload.success) {
        return this.handleSuccess(message, payload, settings, lastRemind);
      }
    } catch (err) {
      logger.error(err);
    }
  }

  private async handleSuccess(
    message: Message,
    { type }: ParserValue,
    settings: SettingsDocument,
    lastRemind: RemindDocument,
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

    const container = new ContainerBuilder().addSectionComponents(
      new SectionBuilder()
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(UsersUtility.getAvatar(user)),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              heading(
                UppyRemindSystemMessage.monitoring.embed.title,
                HeadingLevel.Two,
              ),
              UppyRemindSystemMessage.monitoring.embed.description(
                user,
                points,
                getCommandIdByRemindType(type),
                lastRemind,
              ),
            ].join("\n"),
          ),
        ),
    );

    await Promise.allSettled([
      message
        .reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(null),
      this.logService.logCommandExecution(guild, user, type, points),
      BumpModel.create({
        guildId: guild.id,
        executorId: user.id,
        messageId: message.id,
        points: points,
        type,
      }),
    ]);

    if (type === RemindType.ServerMonitoring) {
      const member = await guild.members.fetch(user.id).catch(() => null);
      try {
        await this.handleBumpBan(member, guild, type, settings);
      } catch (err) {
        logger.error("Ошибка выдачи бамп бана", err);
      }
    }
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
      await Promise.allSettled([
        member.roles.add(bumpBanRole).catch(null),
        this.logService.logBumpBanRoleAdding(guild, member.user),
      ]);
    }

    if (bumpBan?.removeIn + 1 >= BumpBanLimit) {
      await BumpBanModel.deleteOne({ _id: bumpBan._id });
      if (bumpBanRole) {
        member.roles.remove(bumpBanRole).catch(null);
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
