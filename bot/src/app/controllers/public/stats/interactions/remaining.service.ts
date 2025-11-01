import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Interaction,
  InteractionEditReplyOptions,
} from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import { injectable } from "tsyringe";

import { UppyRemainingMessage } from "#/app/messages/remaining.message.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";
import { createSafeCollector } from "#/libs/utils/collector.js";
import type { RemindDocument } from "#/models/remind.model.js";
import { RemindModel } from "#/models/remind.model.js";

import {
  MonitoringBot,
  MonitoringType,
} from "../../reminder/reminder.const.js";
import { StaffCustomIds } from "../stats.const.js";
import { BaseUppyService } from "../stats.service.js";

@injectable()
export class UppyRemainingService extends BaseUppyService {
  async handleRemainingCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const repl = await interaction.editReply(
      await this.buildRemaining(interaction),
    );

    const collector = createSafeCollector(repl, {
      filter: (i) => i.user.id === interaction.user.id,
    });

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;

      const handlers = {
        [StaffCustomIds.remaining.buttons.updaters.updateRemaining]:
          this.handleUpdateRemaining.bind(this),
      };

      return handlers[customId]?.(interaction);
    });
  }

  private async handleUpdateRemaining(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    await interaction.editReply(await this.buildRemaining(interaction));
  }

  private async buildRemaining(
    interaction: Interaction,
  ): Promise<InteractionEditReplyOptions> {
    const [
      discordMonitoring,
      sdcMonitoring,
      serverMonitoring,
      disboardMonitoring,
    ] = await Promise.all([
      this.fetchMonitoringBot(
        interaction.guild!,
        MonitoringBot.DiscordMonitoring,
      ),
      this.fetchMonitoringBot(interaction.guild!, MonitoringBot.SdcMonitoring),
      this.fetchMonitoringBot(
        interaction.guild!,
        MonitoringBot.ServerMonitoring,
      ),
      this.fetchMonitoringBot(
        interaction.guild!,
        MonitoringBot.DisboardMonitoring,
      ),
    ]);

    const types: MonitoringType[] = [];

    if (discordMonitoring) {
      types.push(MonitoringType.DiscordMonitoring);
    }

    if (sdcMonitoring) {
      types.push(MonitoringType.SdcMonitoring);
    }

    if (serverMonitoring) {
      types.push(MonitoringType.ServerMonitoring);
    }

    if (disboardMonitoring) {
      types.push(MonitoringType.DisboardMonitoring);
    }

    const monitorings = await RemindModel.find({
      type: { $in: types },
      guildId: interaction.guildId,
    })
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(types.length);

    const monitoringsMap = Object.fromEntries(
      monitorings.map((m) => [m.type, m as RemindDocument]),
    );

    const updateButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(UppyRemainingMessage.buttons.update)
        .setCustomId(StaffCustomIds.remaining.buttons.updaters.updateRemaining)
        .setStyle(ButtonStyle.Secondary),
    );

    const container = new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                heading(UppyRemainingMessage.embed.title, HeadingLevel.Two),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                UppyRemainingMessage.embed.fields(monitoringsMap as any),
              ].join("\n"),
            ),
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL(
              UsersUtility.getAvatar(interaction.user),
            ),
          ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(updateButton);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }
}
