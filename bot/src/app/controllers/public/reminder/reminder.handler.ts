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

import { BumpBanModel } from "#/db/models/bump-ban.model.js";
import { BumpLogModel } from "#/db/models/bump-log.model.js";
import type { RemindDocument } from "#/db/models/remind.model.js";
import { type SettingsDocument } from "#/db/models/settings.model.js";
import { BumpGuildCalendarRepository } from "#/db/repositories/bump-guild-calendar.repository.js";
import { BumpUserRepository } from "#/db/repositories/bump-user.repository.js";
import { RemindRepository } from "#/db/repositories/remind.repository.js";
import { SettingsRepository } from "#/db/repositories/settings.repository.js";
import { createBump } from "#/db/utils/create-bump.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";
import { logger } from "#/libs/logger/logger.js";
import { calculateDiffTime } from "#/libs/time/diff.js";

import { UppyRemindSystemMessage } from "../../../messages/remind-system.message.js";
import { BumpBanService } from "../bump-ban/bump-ban.service.js";
import { BumpLogService } from "../logging/log.service.js";
import {
  DefaultTimezone,
  getCommandIdByRemindType,
  MonitoringBot,
  MonitoringType,
} from "./reminder.const.js";
import { type ParserValue, ReminderParser } from "./reminder.parser.js";
import { ReminderScheduleManager } from "./reminder-schedule.manager.js";

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
    @inject(BumpLogService) private logService: BumpLogService,
    @inject(BumpBanService) private bumpBanService: BumpBanService,
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
    @inject(BumpGuildCalendarRepository)
    private bumpGuildCalendar: BumpGuildCalendarRepository,
    @inject(BumpUserRepository) private bumpUserRepository: BumpUserRepository,
    @inject(RemindRepository) private remindRepository: RemindRepository
  ) {}

  public async handleCommand(message: Message) {
    try {
      if (
        !Object.values(MonitoringBot).includes(
          message.author.id as MonitoringBot
        )
      ) {
        return;
      }

      const payload = this.commandParser.handleMonitoring(message);
      const guildId = message.guildId;

      if (!payload) {
        return;
      }

      const settings = await this.settingsRepository.findGuildSettings(
        guildId!
      );

      const remind = await this.scheduleManager.remind({
        settings: settings!,
        ...payload,
      });

      if (process.env.APP_ENV == "dev" || payload.success) {
        return this.handleSuccess(message, payload, settings!, remind!);
      }
    } catch (err) {
      logger.error(err);
    }
  }

  private async handleSuccess(
    message: Message,
    { type }: ParserValue,
    settings: SettingsDocument,
    lastRemind: RemindDocument | null
  ) {
    const existed = await BumpLogModel.findOne({ messageId: message.id });

    if (existed) {
      return;
    }

    const GMTNow = DateTime.now().setZone(DefaultTimezone);
    const nowHours = GMTNow.hour;
    const guild = message.guild;
    const user = message.interactionMetadata?.user;

    const config = settings.points.enabled
      ? this.getFieldByType(type as MonitoringType, settings)
      : { default: 0, bonus: 0 };

    let points = config.default;

    if (nowHours >= 0 && nowHours <= 7) {
      points += config.bonus;
    }

    const container = new ContainerBuilder().addSectionComponents(
      new SectionBuilder()
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(UsersUtility.getAvatar(user!))
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              heading(
                UppyRemindSystemMessage.monitoring.embed.title,
                HeadingLevel.Two
              ),
              UppyRemindSystemMessage.monitoring.embed.description(
                user!,
                points,
                getCommandIdByRemindType(type)!,
                message.createdAt,
                lastRemind,
                settings.points.enabled
              ),
            ].join("\n")
          )
        )
    );

    await Promise.allSettled([
      message
        .reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: {
            roles: [],
            users: [],
          },
        })
        .catch(null),
      this.logService.sendCommandExecutionLog(
        guild!,
        user!,
        type as MonitoringType,
        points,
        calculateDiffTime(
          message.createdAt,
          lastRemind?.timestamp ?? new Date()
        )
      ),
      createBump({
        guildId: guild!.id,
        executorId: user!.id,
        points,
        type,
        messageId: message.id,
      }),
    ]);

    if (type === MonitoringType.ServerMonitoring) {
      const member = await guild?.members.fetch(user!.id).catch(() => null);
      if (!member) {
        return;
      }
      await this.handleBumpBan(member, guild!, type, settings);
    }
  }

  private getFieldByType(type: MonitoringType, settings: SettingsDocument) {
    switch (type) {
      case MonitoringType.DiscordMonitoring:
        return settings.points.dsMonitoring;
      case MonitoringType.SdcMonitoring:
        return settings.points.sdc;
      case MonitoringType.ServerMonitoring:
        return settings.points.server;
      case MonitoringType.DisboardMonitoring:
        return settings.points.disboard;
    }
  }

  private async handleBumpBan(
    member: GuildMember,
    guild: Guild,
    type: MonitoringType,
    settings: SettingsDocument
  ) {
    if (!settings.bumpBan.enabled) {
      return;
    }

    await Promise.all([
      BumpBanModel.updateMany(
        {
          guildId: guild.id,
          userId: { $ne: member.id },
        },
        {
          $inc: {
            removeIn: 1,
          },
        }
      ),
      this.bumpBanService.addBumpBan({
        member,
        settings,
        type,
      }),
    ]);

    await this.bumpBanService.handlePostIncrementBumpBans(guild, type);
  }
}
