import type {
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  Interaction,
  InteractionEditReplyOptions,
} from "discord.js";
import { injectable } from "tsyringe";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { HelperBotMessages } from "#/messages/index.js";
import { type RemindDocument, RemindModel } from "#/models/reminder.model.js";

import {
  getCommandByRemindType,
  MonitoringBot,
  RemindType,
} from "./reminder.const.js";

@injectable()
export class ReminderService {
  async handleReminderStatus(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply(
      await this.buildReminderStatusMessage(interaction),
    );
  }

  private async buildReminderStatusMessage(
    interaction: Interaction,
  ): Promise<InteractionEditReplyOptions> {
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

    const monitoringsMap = Object.fromEntries(
      monitorings.map((m) => [
        getCommandByRemindType(m.type as RemindType),
        m as RemindDocument,
      ]),
    );

    const embed = new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(HelperBotMessages.remind.statusAll.embed.title)
      .setFields(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        HelperBotMessages.remind.statusAll.embed.fields(monitoringsMap as any),
      );

    return {
      embeds: [embed],
    };
  }

  private async fetchMonitoringBot(
    guild: Guild,
    id: MonitoringBot,
  ): Promise<GuildMember | null> {
    return await guild.members.fetch(id).catch(() => null);
  }
}
