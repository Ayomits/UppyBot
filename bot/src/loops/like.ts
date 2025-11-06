import {
  ContainerBuilder,
  type Guild,
  heading,
  MessageFlags,
  unorderedList,
} from "discord.js";
import type { Client } from "discordx";
import { parse } from "node-html-parser";
import { inject, injectable } from "tsyringe";

import { fetchServer } from "#/api/ds-monitoring/api.js";
import { BumpLogService } from "#/app/controllers/public/logging/log.service.js";
import { MonitoringType } from "#/app/controllers/public/reminder/reminder.const.js";
import { ReminderScheduleManager } from "#/app/controllers/public/reminder/reminder-schedule.manager.js";
import type { SettingsDocument } from "#/db/models/settings.model.js";
import { BumpLogRepository } from "#/db/repositories/bump-log-repository.js";
import { GuildRepository } from "#/db/repositories/guild.repository.js";
import { SettingsRepository } from "#/db/repositories/settings.repository.js";
import { createBump } from "#/db/utils/create-bump.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";
import { logger } from "#/libs/logger/logger.js";

import type { Loop } from "./__interface.js";

type ParsedUser = { id: string; isSite: boolean; timestamp: Date };

@injectable()
export class LikeLoop implements Loop {
  constructor(
    @inject(ReminderScheduleManager)
    private remindScheduleManager: ReminderScheduleManager,
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
    @inject(BumpLogService) private logService: BumpLogService,
    @inject(BumpLogRepository) private bumpLogRepository: BumpLogRepository
  ) {}

  async create(client: Client) {
    logger.log("Initial like sync stated");
    await this.task(client);
    logger.log("Initial like sync ended");
    setInterval(async () => {
      logger.log("Like sync executed");
      await this.task(client).then();
      logger.info("Like sync ended");
    }, 300_000);
  }

  async task(client: Client): Promise<void> {
    const guildRepository = GuildRepository.create();
    const guilds = await guildRepository.findMany({ isActive: true });
    const obj: Record<string, ParsedUser[]> = {};

    for (const guild of guilds) {
      try {
        obj[guild.guildId] = await this.parseHtml(guild.guildId);
      } catch {
        obj[guild.guildId] = [];
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    for (const guildId in obj) {
      const guild = client.guilds.cache.get(guildId);
      const entry = obj[guildId];
      const settings = await this.settingsRepository.findGuildSettings(guildId);

      for (const user of entry) {
        await Promise.all([
          this.ensureRemind(guild!, user.timestamp, settings),
          this.ensureBumpUser(guild!, user.id, user.timestamp, settings),
        ]);
      }
    }
  }

  private async ensureBumpUser(
    guild: Guild,
    executorId: string,
    timestamp: Date,
    settings: SettingsDocument
  ) {
    const hasLog = await this.bumpLogRepository.findByTimestamp(
      guild.id,
      executorId,
      timestamp,
      MonitoringType.DiscordMonitoring
    );

    if (hasLog) {
      return;
    }

    let points = 0;

    if (settings.points.enabled) {
      points =
        settings.points.dsMonitoring.default +
        settings.points.dsMonitoring.bonus;
    }

    await createBump({
      guildId: guild.id,
      executorId,
      points,
      type: MonitoringType.DiscordMonitoring,
      timestamp,
    });

    const author = await guild.members.fetch(executorId).catch(null);

    if (!author) {
      return;
    }

    const channel = await guild.channels
      .fetch(settings.channels.pingChannelId ?? "")
      .catch(null);

    if (!channel) {
      return;
    }

    const container = new ContainerBuilder().addSectionComponents((builder) =>
      builder
        .setThumbnailAccessory((builder) =>
          builder.setURL(UsersUtility.getAvatar(author))
        )
        .addTextDisplayComponents((builder) =>
          builder.setContent(
            [
              heading("Команда /like на сайте"),
              unorderedList([`Исполнитель: ${author}`, `Поинты: ${points}`]),
            ].join("\n")
          )
        )
    );

    if (channel.isSendable()) {
      await channel
        .send({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: {
            users: [],
          },
        })
        .catch(null);
    }
  }

  private async ensureRemind(
    guild: Guild,
    timestamp: Date,
    settings: SettingsDocument
  ) {
    await this.remindScheduleManager.remind({
      guild,
      settings,
      timestamp,
      type: MonitoringType.DiscordMonitoring,
    });
  }

  private async parseHtml(guildId: string): Promise<ParsedUser[]> {
    const response = await fetchServer(guildId).catch(null);

    if (!response) {
      return [];
    }

    const html = response.data;

    const obj = parse(html, {
      parseNoneClosedTags: false,
    });
    const main = obj.querySelector("main");
    const lastLike = main?.querySelector(".last-like");
    const logsMain = lastLike?.querySelector(".logs");
    const logs = logsMain?.querySelectorAll(".log");

    const users: ParsedUser[] = [];

    for (const log of logs ?? []) {
      const [usr, action] = log.querySelectorAll(".col");
      const timestamp = log
        .querySelector(".like_time")
        ?.getAttribute("data-unix");
      const [, , userId] = usr.text.split(" ");
      const isSite = action.text.includes("discordserver.info");
      users.push({
        id: userId,
        isSite,
        timestamp: new Date(Number(timestamp!) * 1_000),
      });
    }

    return users
      .filter((u) => u.isSite)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}
