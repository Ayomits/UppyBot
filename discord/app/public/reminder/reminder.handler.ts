import {
  bold,
  chatInputApplicationCommandMention,
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
  userMention,
} from "discord.js";
import { DateTime } from "luxon";
import { inject, singleton } from "tsyringe";

import { appEventEmitter } from "#/discord/events/emitter.js";
import { BumpBanModel } from "#/shared/db/models/uppy-discord/bump-ban.model.js";
import { BumpLogModel } from "#/shared/db/models/uppy-discord/bump-log.model.js";
import type { RemindDocument } from "#/shared/db/models/uppy-discord/remind.model.js";
import { type SettingsDocument } from "#/shared/db/models/uppy-discord/settings.model.js";
import { RemindRepository } from "#/shared/db/repositories/uppy-discord/remind.repository.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { createBump } from "#/shared/db/utils/create-bump.js";
import { UsersUtility } from "#/shared/libs/embed/users.utility.js";
import { logger } from "#/shared/libs/logger/index.js";
import { calculateDiffTime } from "#/shared/libs/time/diff.js";

import { BumpBanService } from "../bump-ban/bump-ban.service.js";
import {
  getCommandIdByRemindType,
  getCommandNameByCommandId,
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
    @inject(BumpBanService) private bumpBanService: BumpBanService,
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
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

      const lastRemind = await this.remindRepository.findRemind(
        payload.guild!.id,
        payload.type
      );

      await this.scheduleManager.remind({
        settings: settings!,
        ...payload,
      });

      if (process.env.APP_ENV == "dev" || payload.success) {
        return this.handleSuccess(message, payload, settings!, lastRemind!);
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
    const existed = await BumpLogModel.model.findOne({ messageId: message.id });

    if (existed) {
      return;
    }

    const GMTNow = DateTime.now();
    const nowHours = GMTNow.hour;
    const guild = message.guild;
    const user = message.interactionMetadata?.user;

    const config = settings.points.enabled
      ? this.getFieldByType(type as MonitoringType, settings)
      : { default: 0, bonus: 0 };

    let points = config?.default ?? 0;

    if (nowHours >= 0 && nowHours <= 7) {
      points += config?.bonus ?? 0;
    }

    const command = getCommandIdByRemindType(type)!;

    const reactionTime = calculateDiffTime(
      message.createdAt,
      new Date(lastRemind!.timestamp!)
    );

    const container = new ContainerBuilder().addSectionComponents(
      new SectionBuilder()
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(UsersUtility.getAvatar(user!))
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              heading("Продвижение на сервере", HeadingLevel.Two),
              [
                `Команда: ${chatInputApplicationCommandMention(getCommandNameByCommandId(command)!, command)}`,
                settings.points.enabled
                  ? `Поинты: ${bold(`${points} поинтов`)}`
                  : "",
                `Исполнитель: ${userMention(user!.id)}`,
                `Время реакции: ${reactionTime}`,
              ]
                .filter(Boolean)
                .join("\n"),
            ].join("\n")
          )
        )
    );

    appEventEmitter.emit("command:executed", {
      guildId: guild!.id,
      settings,
      channelId: message.channelId,
      avatarUrl: UsersUtility.getAvatar(user!),
      type,
      userId: user!.id,
      points,
      reactionTime,
    });
    
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
      BumpBanModel.model.updateMany(
        {
          guildId: guild.id,
          userId: { $ne: member.id },
        },
        {
          $inc: {
            counter: 1,
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
