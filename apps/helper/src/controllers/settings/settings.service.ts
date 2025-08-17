/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from "@fear/prisma";
import { createSafeCollector } from "@fear/utils";
import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type GuildMember,
  type Interaction,
  type InteractionEditReplyOptions,
} from "discord.js";
import { injectable } from "tsyringe";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { HelperBotMessages } from "#/messages/index.js";

import { SettingsCustomIds } from "./settings.const.js";

@injectable()
export class SettingsService {
  constructor() {}

  public async handleSettings(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const reply = await interaction.editReply(
      await this.createSettingsMessage(interaction),
    );

    const collector = createSafeCollector(reply, {
      filter: (i) => (i.member as GuildMember).permissions.has("Administrator"),
    });

    collector.on("collect", (interaction) => {});
  }

  private async handleUpdateSettingsMessage(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    await interaction.editReply(await this.createSettingsMessage(interaction));
  }

  private async createSettingsMessage(
    interaction: Interaction,
  ): Promise<InteractionEditReplyOptions> {
    const guildId = interaction.guildId;
    const settings = await prisma.helperBotSettings.upsert({
      where: {
        guildId,
      },
      create: {
        guildId,
      },
      update: {},
    });

    const embed = new EmbedBuilder()
      .setTitle(HelperBotMessages.settings.panel.title)
      .setFields(HelperBotMessages.settings.panel.fields(settings))
      .setDefaults(interaction.user);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(HelperBotMessages.settings.panel.buttons.managers.channels)
        .setCustomId(SettingsCustomIds.buttons.managers.channels)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel(HelperBotMessages.settings.panel.buttons.managers.roles)
        .setCustomId(SettingsCustomIds.buttons.managers.roles)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel(HelperBotMessages.settings.panel.buttons.updaters.panel)
        .setCustomId(SettingsCustomIds.buttons.updaters.panel)
        .setStyle(ButtonStyle.Secondary),
    );

    return {
      embeds: [embed],
      components: [row],
    };
  }
}
