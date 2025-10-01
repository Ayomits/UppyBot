import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionEditReplyOptions,
} from "discord.js";
import {
  bold,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
  SectionBuilder,
  unorderedList,
} from "discord.js";
import type { Client } from "discordx";
import { inject, injectable } from "tsyringe";

import { UsersUtility } from "#/libs/embed/users.utility.js";
import { createSafeCollector } from "#/libs/utils/collector.js";
import { LatencyService } from "#/shared/services/latency.service.js";

import { UppyCoreCustomIds } from "../bot.const.js";

@injectable()
export class UppyBotPingService {
  constructor(@inject(LatencyService) private latencyService: LatencyService) {}

  async handleLatencyCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const repl = await interaction.editReply(
      await this.buildMessage(interaction)
    );

    const collector = createSafeCollector(repl, {
      filter: (i) => i.user.id === interaction.user.id,
    });

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;
      const handlers = {
        [UppyCoreCustomIds.buttons.actions.refresh]:
          this.handleRefreshButton.bind(this),
      };

      return handlers[customId](interaction);
    });
  }

  private async handleRefreshButton(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    interaction.editReply(await this.buildMessage(interaction));
  }

  private async buildMessage(
    interaction: ChatInputCommandInteraction | ButtonInteraction
  ): Promise<InteractionEditReplyOptions> {
    const [ws, mongo] = [
      this.latencyService.wsLatency(interaction.client as Client),
      await this.latencyService.mongoLatency(),
    ];

    const container = new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
          .setThumbnailAccessory((builder) =>
            builder.setURL(UsersUtility.getAvatar(interaction.user))
          )
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [
                heading("Задержка бота", HeadingLevel.Two),
                unorderedList([
                  `${bold("Mongo:")} ${mongo}ms`,
                  `${bold("WS:")} ${ws}ms`,
                ]),
              ].join("\n")
            )
          )
      )
      .addSeparatorComponents((builder) => builder.setDivider(true))
      .addActionRowComponents((row) =>
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(UppyCoreCustomIds.buttons.actions.refresh)
            .setLabel("Обновить")
            .setStyle(ButtonStyle.Secondary)
        )
      );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }
}
