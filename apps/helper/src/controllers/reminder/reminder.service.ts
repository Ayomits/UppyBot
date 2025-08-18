/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  Interaction,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { injectable } from "tsyringe";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { HelperBotMessages } from "#/messages/index.js";
import { RemindModel } from "#/models/reminder.model.js";

import { MonitoringBot, RemindType } from "./reminder.const.js";

@injectable()
export class ReminderService {
  // Эта команда показывает кд всех ботов
  async handleReminderStatus(interaction: ChatInputCommandInteraction) {}

  // Эта команда показывает кд конкретного бота
  async handleReminderBotStatus(
    interaction: UserContextMenuCommandInteraction,
  ) {}

  private async buildReminderStatusMessage(interaction: Interaction) {
    const [discordMonitoring, sdcMonitoring, serverMonitoring] =
      await Promise.all([
        this.fetchMonitoringBot(
          interaction.guild!,
          MonitoringBot.DiscordMonitoring,
        ),
        this.fetchMonitoringBot(
          interaction.guild!,
          MonitoringBot.SdcMonitoring,
        ),
        this.fetchMonitoringBot(
          interaction.guild!,
          MonitoringBot.ServerMonitoring,
        ),
      ]);

    const types: RemindType[] = [];

    if (discordMonitoring) {
      types.push(RemindType.DiscordMonitoring);
    }

    if (sdcMonitoring) {
      types.push(RemindType.SdcMonitoring);
    }

    if (serverMonitoring) {
      types.push(RemindType.ServerMonitoring);
    }

    const monitorings = await RemindModel.find({
      type: { $in: types },
      guildId: interaction.guildId,
    }).sort({ timestamp: -1 });

    const embed = new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(HelperBotMessages.remind.statusAll.embed.title);
  }

  private async fetchMonitoringBot(
    guild: Guild,
    id: MonitoringBot,
  ): Promise<GuildMember | null> {
    return await guild.members.fetch(id).catch(() => null);
  }
}
