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
import { BumpBanModel } from "#/models/bump-ban.model.js";
import { BumpGuildCalendarModel } from "#/models/bump-guild-calendar.model.js";
import { BumpLogModel } from "#/models/bump-log.model.js";
import { BumpUserModel } from "#/models/bump-user.model.js";
import { BumpUserCalendarModel } from "#/models/bump-user-calendar.model.js";
import { safePointConfig } from "#/models/points-settings.model.js";
import type { RemindDocument } from "#/models/remind.model.js";
import { RemindModel } from "#/models/remind.model.js";
import {
  type SettingsDocument,
  SettingsModel,
} from "#/models/settings.model.js";

import { UppyRemindSystemMessage } from "../../messages/remind-system.message.js";
import { UppyLogService } from "../logging/log.service.js";
import { endDateValue, startDateValue } from "../uppy/uppy.const.js";
import {
  BumpBanLimit,
  DefaultTimezone,
  getCommandIdByRemindType,
  getFieldByRemindType,
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
    @inject(UppyLogService) private logService: UppyLogService,
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
    const existed = await BumpLogModel.findOne({ messageId: message.id });

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
          allowedMentions: {
            roles: [],
            users: [],
            repliedUser: null,
            parse: [],
          },
        })
        .catch(null),
      this.logService.sendCommandExecutionLog(guild, user, type, points),
      this.createBump({
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
      .fetch(settings?.bumpBanRoleId)
      .catch(() => null);

    const bumpBan = await BumpBanModel.findOneAndUpdate(
      { guildId: guild.id, userId: member.id, type },
      {},
      { upsert: true },
    );

    if (bumpBanRole) {
      await Promise.allSettled([
        member.roles.add(bumpBanRole).catch(null),
        this.logService.sendBumpBanRoleAddingLog(guild, member.user),
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

  private async createBump({
    guildId,
    executorId,
    messageId,
    points,
    type,
  }: {
    guildId: string;
    executorId: string;
    messageId: string;
    points: number;
    type: number | RemindType;
  }) {
    const start = DateTime.now().set(startDateValue);
    const timestampFilter = {
      $gte: start.toJSDate(),
      $lte: DateTime.now().set(endDateValue).toJSDate(),
    };

    await Promise.all([
      BumpLogModel.create({
        guildId,
        executorId,
        messageId,
        points,
        type,
      }),
      BumpGuildCalendarModel.findOneAndUpdate(
        {
          guildId,
          timestamp: timestampFilter,
        },
        {
          $setOnInsert: {
            timestamp: start.toJSDate(),
            formatted: start.toFormat("dd.MM.yyyy"),
            guildId,
          },
        },
        {
          upsert: true,
        },
      ),
      BumpUserCalendarModel.findOneAndUpdate(
        {
          guildId,
          userId: executorId,
          timestamp: timestampFilter,
        },
        {
          $setOnInsert: {
            timestamp: start.toJSDate(),
            formatted: start.toFormat("D.MM.YY"),
            guildId,
            userId: executorId,
          },
        },
        {
          upsert: true,
        },
      ),
      BumpUserModel.bulkWrite([
        {
          updateOne: {
            filter: {
              guildId,
              userId: executorId,
              timestamp: timestampFilter,
            },
            update: {
              $inc: {
                points: points,
                [getFieldByRemindType(type)]: 1,
              },
              $setOnInsert: {
                timestamp: start.toJSDate(),
                userId: executorId,
                guildId: guildId,
              },
            },
            upsert: true,
          },
        },
      ]),
    ]);
  }
}
