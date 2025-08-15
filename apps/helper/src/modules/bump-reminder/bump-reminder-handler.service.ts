import {
  type APIEmbed,
  type Guild,
  type Message,
  type Snowflake,
  type TextChannel,
  type User,
} from "discord.js";
import { inject, injectable } from "tsyringe";

import {
  type BumpReminderModuleDocument,
  BumpReminderModuleModel,
} from "#/db/models/bump-reminder.model.js";
import { HelperModel } from "#/db/models/helper.model.js";
import { BumpReminderRepository } from "#/db/repositories/bump-reminder.repository.js";
import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import ScheduleManager from "#/libs/system/schedule-manager.js";
import { parseHHMMSS } from "#/libs/system/time-parser.js";

import { MonitoringBot } from "./bump-reminder.const.js";

@injectable()
export class BumpReminderHandlerService {
  constructor(
    @inject(BumpReminderRepository)
    private bumpReminderRepository: BumpReminderRepository
  ) {}

  public async handleMonitoringMessage(message: Message) {
    const author = message.member;
    const guild = message.guild;
    const channelId = message.channelId;
    const embeds = message.embeds;
    if (
      !guild ||
      !embeds.length ||
      !embeds[0]?.description ||
      ![
        MonitoringBot.DiscordMonitoring as string,
        MonitoringBot.SdcMonitoring as string,
        MonitoringBot.ServerMonitoring as string,
      ].includes(author.id)
    ) {
      return;
    }

    const bumpSettings =
      await this.bumpReminderRepository.findOrCreateByGuildId(guild.id);
    if (!bumpSettings.enable || bumpSettings.pingChannelId !== channelId) {
      return;
    }

    const embed = embeds[0];

    switch (author.id) {
      case MonitoringBot.DiscordMonitoring:
        return this.handleDiscordMonitoring(
          guild,
          bumpSettings,
          embed,
          message.interactionMetadata.user
        );
      case MonitoringBot.SdcMonitoring:
        return this.handleSdcMonitoring(
          guild,
          bumpSettings,
          embed,
          message.interactionMetadata.user
        );
      case MonitoringBot.ServerMonitoring:
        return this.handleServerMonitoring(
          guild,
          bumpSettings,
          embed,
          message.interactionMetadata.user
        );
    }
  }

  private async handleDiscordMonitoring(
    guild: Guild,
    bumpSettings: BumpReminderModuleDocument,
    embed: APIEmbed,
    user: User
  ) {
    const nextTimestamp = new Date(embed.timestamp!).getTime();

    const updateLast = !embed.description?.includes("Не так быстро, сэр.");

    await this.updateTimestamps(
      bumpSettings,
      "discordMonitoring",
      nextTimestamp,
      updateLast,
      user,
      guild
    );
    await this.setWarningAndSchedule(
      bumpSettings,
      "discordMonitoring",
      nextTimestamp,
      guild
    );
  }

  private async handleSdcMonitoring(
    guild: Guild,
    bumpSettings: BumpReminderModuleDocument,
    embed: APIEmbed,
    user: User
  ) {
    let timestamp: number;

    if (embed.description?.includes("Успешный Up!")) {
      timestamp = Date.now();
      await this.updateTimestamps(
        bumpSettings,
        "sdcMonitoring",
        timestamp,
        true,
        user,
        guild
      );
    } else {
      const match = embed.description?.match(/<t:(\d+):[tTdDfFR]?>/);
      if (!match) {
        return;
      }
      const unix = Number(match[1]);
      timestamp = unix * 1000;
      await this.updateTimestamps(
        bumpSettings,
        "sdcMonitoring",
        timestamp,
        false
      );
    }

    await this.setWarningAndSchedule(
      bumpSettings,
      "sdcMonitoring",
      timestamp,
      guild
    );
  }

  private async handleServerMonitoring(
    guild: Guild,
    bumpSettings: BumpReminderModuleDocument,
    embed: APIEmbed,
    user: User
  ) {
    let timestamp: number;
    if (embed.description.includes("Server bumped by")) {
      await this.handleBump(user.id, guild);

      timestamp = Date.now() + 4 * 60 * 60 * 1000;
      await this.updateTimestamps(
        bumpSettings,
        "serverMonitoring",
        timestamp,
        true,
        user,
        guild
      );
    } else {
      const delay = parseHHMMSS(embed.description);
      timestamp = Date.now() + delay;

      await this.updateTimestamps(
        bumpSettings,
        "serverMonitoring",
        timestamp,
        false
      );
    }

    await this.setWarningAndSchedule(
      bumpSettings,
      "serverMonitoring",
      timestamp,
      guild
    );
  }

  private async updateTimestamps(
    bumpSettings: BumpReminderModuleDocument,
    key: keyof BumpReminderModuleDocument,
    next: Date | number | string,
    updateLast: boolean,
    user?: User,
    guild?: Guild
  ) {
    const nextDate = new Date(next);

    const updateData = {
      $set: { [`${key}.next`]: nextDate },
    };

    if (updateLast) {
      this.sendActionMessage(key, user, guild, bumpSettings);
      updateData.$set[`${key}.last`] = new Date();
    }

    await BumpReminderModuleModel.findByIdAndUpdate(
      bumpSettings._id,
      updateData
    );
  }

  private async setWarningAndSchedule(
    bumpSettings: BumpReminderModuleDocument,
    key: keyof BumpReminderModuleDocument,
    nextTimestamp: Date | number | string,
    guild: Guild
  ) {
    const eventTime = new Date(nextTimestamp);
    const warningTime = new Date(eventTime.getTime() - 30_000);

    await BumpReminderModuleModel.findByIdAndUpdate(bumpSettings._id, {
      $set: { [`${key}.warning`]: warningTime },
    });

    ScheduleManager.set(
      guild,
      `${String(key)}_warning`,
      {
        warning: warningTime,
        event: eventTime,
      },
      async (guild, monitoring, type) => {
        if (type === "warning") {
          await this.sendWarningMessage(guild, bumpSettings, String(key));
        } else if (type === "event") {
          await this.handleEvent(guild, bumpSettings, String(key));
        }
      }
    );
  }

  public async sendActionMessage(
    key: string,
    user: User,
    guild: Guild,
    bumpsettings: BumpReminderModuleDocument
  ) {
    const channel = guild.channels.cache.get(
      bumpsettings.pingChannelId
    ) as TextChannel;
    if (!channel) {
      return;
    }

    const pointstoadd = ["sdcMonitoring", "discordMonitoring"].includes(key)
      ? 1
      : 2;

    const updated = await HelperModel.findOneAndUpdate(
      { userId: user.id, guildId: guild.id },
      {
        $inc: {
          "helperpoints.weekly": pointstoadd,
          "helperpoints.alltime": pointstoadd,
          "helperpoints.twoweeks": pointstoadd,
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      return;
    }

    const updatedPoints = updated.helperpoints.weekly ?? 0;

    const embed = new EmbedBuilder()
      .setDefaults(user)
      .setTitle(user.username || user.displayName)
      .setDescription(
        `<@${user.id}> успешно продвинул сервер **${guild.name}**\n` +
          `На данный момент у вас — ${formatPoints(updatedPoints)}`
      );

    await channel.send({ embeds: [embed] });
  }

  public async sendWarningMessage(
    guild: Guild,
    bumpsettings: BumpReminderModuleDocument,
    key: string
  ) {
    const channel = guild.channels.cache.get(
      bumpsettings.pingChannelId
    ) as TextChannel;
    if (!channel) {
      return;
    }
    const cmdid =
      key === "sdcMonitoring"
        ? "891377101494681660"
        : key === "discordMonitoring"
          ? "788801838828879933"
          : "956435492398841858";
    const cmdname =
      key === "sdcMonitoring"
        ? "up"
        : key === "discordMonitoring"
          ? "like"
          : "bump";
    const timestamp = bumpsettings[key].next;
    const discordTimestamp = timestamp
      ? Math.floor(new Date(timestamp).getTime() / 1000)
      : 0;

    await channel.send({
      content: `<@&${bumpsettings.helperRoleID[0]}>, Осталось 30 секунд, надо будет прописать  </${cmdname}:${cmdid}>\n<t:${discordTimestamp}:R>`,
    });

    // TODO: логика уведомления
  }

  public async handleEvent(
    guild: Guild,
    bumpsettings: BumpReminderModuleDocument,
    key: string
  ) {
    const channel = guild.channels.cache.get(
      bumpsettings.pingChannelId
    ) as TextChannel;
    if (!channel) {
      return;
    }
    const cmdid =
      key === "sdcMonitoring"
        ? "891377101494681660"
        : key === "discordMonitoring"
          ? "788801838828879933"
          : "956435492398841858";
    const cmdname =
      key === "sdcMonitoring"
        ? "up"
        : key === "discordMonitoring"
          ? "like"
          : "bump";
    await channel.send({
      content: `<@&${bumpsettings.helperRoleID[0]}> </${cmdname}:${cmdid}>\n WORK! WORK! WORK!  `,
    });
  }

  private async handleBump(userId: Snowflake, guild: Guild) {
    const dbguild = await this.bumpReminderRepository.findOrCreateByGuildId(
      guild.id
    );
    const allHelpers = await HelperModel.find({
      guildId: guild.id,
    });

    if (!allHelpers || allHelpers.length === 0) {
      return;
    }

    const bumpbanRoleId = dbguild?.bumpbanRole?.[0];

    for (const helper of allHelpers) {
      if (helper.userId === userId) continue;
      if (!helper.nextBump || helper.nextBump === 0) continue;

      const newNextBump = helper.nextBump + 1;

      if (newNextBump >= 6) {
        await helper.updateOne({ nextBump: 0 });
        const member = await guild.members
          .fetch(helper.userId)
          .catch(() => null);
        if (member && bumpbanRoleId) {
          await member.roles.remove(bumpbanRoleId).catch(() => null);
        }
      } else {
        await helper.updateOne({ nextBump: newNextBump });
        const member = await guild.members
          .fetch(helper.userId)
          .catch(() => null);
        if (member && !member.roles.cache.has(bumpbanRoleId)) {
          return await member.roles.add(bumpbanRoleId).catch(() => null);
        }
      }
    }

    const dbhelper = allHelpers.find((h) => h.userId === userId);
    if (!dbhelper) return;
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    if (dbhelper.nextBump === 0) {
      await dbhelper.updateOne({ nextBump: 1 });
      if (bumpbanRoleId) {
        return await member.roles.add(bumpbanRoleId).catch(() => null);
      }
    }
  }
}
function formatPoints(points) {
  points = Math.abs(points) % 100;
  const lastDigit = points % 10;

  if (points > 10 && points < 20) {
    return `${points} баллов`;
  }
  if (lastDigit === 1) {
    return `${points} балл`;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${points} балла`;
  }
  return `${points} баллов`;
}
