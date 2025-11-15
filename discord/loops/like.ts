import type { Guild, TextChannel } from "discord.js";
import {
  ContainerBuilder,
  heading,
  MessageFlags,
  unorderedList,
} from "discord.js";
import { DateTime } from "luxon";
import { parse } from "node-html-parser";
import { inject, injectable } from "tsyringe";

import { likeSyncProduce } from "#/queue/routes/like-sync/producers/index.js";
import type { SettingsDocument } from "#/shared/db/models/uppy-discord/settings.model.js";
import { BumpLogRepository } from "#/shared/db/repositories/uppy-discord/bump-log-repository.js";
import { GuildRepository } from "#/shared/db/repositories/uppy-discord/guild.repository.js";
import { RemindRepository } from "#/shared/db/repositories/uppy-discord/remind.repository.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { createBump } from "#/shared/db/utils/create-bump.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";
import { UsersUtility } from "#/shared/libs/embed/users.utility.js";
import { logger } from "#/shared/libs/logger/logger.js";

import { fetchServer } from "../../shared/api/ds-monitoring/index.js";
import { WebhookManager } from "../../shared/webhooks/webhook.manager.js";
import { MonitoringType } from "../app/public/reminder/reminder.const.js";
import { ReminderScheduleManager } from "../app/public/reminder/reminder-schedule.manager.js";
import { discordClient } from "../client.js";
import type { Loop } from "./__interface.js";

type ParsedUser = { id: string; isSite: boolean; timestamp: Date };

@injectable()
export class WebLikeSyncManager implements Loop {
  constructor(
    @inject(ReminderScheduleManager)
    private remindScheduleManager: ReminderScheduleManager,
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
    @inject(BumpLogRepository) private bumpLogRepository: BumpLogRepository,
    @inject(WebhookManager) private webhookManager: WebhookManager,
    @inject(CryptographyService)
    private cryptographyService: CryptographyService
  ) {}

  async create() {
    logger.log("Initial like sync stated");
    await this.task();
    logger.log("Initial like sync ended");
    setInterval(async () => {
      logger.log("Like sync started");
      await this.task();
      logger.log("Like sync ended");
    }, 300_000);
  }

  static create() {
    const settingsRepository = SettingsRepository.create();
    const remindRepository = RemindRepository.create();
    const webhookManager = WebhookManager.create();
    const cryptography = CryptographyService.create();
    return new WebLikeSyncManager(
      new ReminderScheduleManager(
        settingsRepository,
        remindRepository,
        webhookManager,
        cryptography
      ),
      settingsRepository,
      BumpLogRepository.create(),
      webhookManager,
      cryptography
    );
  }

  async task(): Promise<void> {
    const guildRepository = GuildRepository.create();
    const guilds = (
      await guildRepository.findMany({
        isActive: true,
        guildId: { $in: discordClient.guilds.cache.map((g) => g.id) },
      })
    ).map((guild) => guild.guildId);
    for (const guildId of guilds) {
      likeSyncProduce({ guildId: guildId });
    }
  }

  public async syncGuildLikes(guild: Guild | null | undefined) {
    if (!guild) return;
    const guildId = guild.id;
    const users = await this.parseHtml(guildId);
    logger.info(`Start like sync for guild ${guildId}`);
    if (users.length === 0) {
      logger.info(`No web like users for ${guildId}. Skip`);
      return;
    }
    const settings = await this.settingsRepository.findGuildSettings(guildId);
    const lastUser = users[users.length - 1];
    logger.info(`${users.length} users for ${guildId} syncing`);
    await Promise.all([
      ...users
        .filter((usr) => usr.isSite)
        .map((user) =>
          this.ensureBumpUser(guild!, user.id, user.timestamp, settings)
        ),
      this.ensureRemind(guild!, lastUser.timestamp, settings),
    ]);
    logger.info(`${users.length} users for ${guildId} synced`);
  }

  private async ensureBumpUser(
    guild: Guild,
    executorId: string,
    timestamp: Date,
    settings: SettingsDocument
  ) {
    if (!guild) {
      return;
    }
    const hasLog = await this.bumpLogRepository.findByTimestamp(
      guild?.id,
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

    if (settings.webhooks?.url) {
      this.webhookManager.pushConsumer(
        settings.webhooks?.url,
        this.cryptographyService.decrypt(settings.webhooks.token!),
        this.webhookManager.createCommandExecutedPayload(settings.guildId, {
          channelId: null,
          executedAt: timestamp,
          points,
          type: MonitoringType.DiscordMonitoring,
          userId: executorId,
        })
      );
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

    const channel = (await guild.channels
      .fetch(settings.channels.pingChannelId ?? "")
      .catch(null)) as TextChannel | null;

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

    try {
      await channel
        .send({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: {
            users: [],
          },
        })
        .catch(null);
    } catch {
      //
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
      timestamp: DateTime.fromJSDate(timestamp).plus({ hours: 4 }).toJSDate(),
      type: MonitoringType.DiscordMonitoring,
    });
  }

  private async parseHtml(guildId: string): Promise<ParsedUser[]> {
    const response = await fetchServer(guildId).catch(() => null);

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

    return users.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}
