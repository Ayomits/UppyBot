import type {
  ButtonInteraction,
  InteractionEditReplyOptions,
} from "discord.js";
import {
  bold,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  unorderedList,
} from "discord.js";
import type { Client } from "discordx";
import { inject, injectable } from "tsyringe";

import { UsersUtility } from "#/libs/embed/users.utility.js";
import { createSafeCollector } from "#/libs/utils/collector.js";
import { LatencyService } from "#/shared/services/latency.service.js";

import { CoreCustomIds } from "./core.const.js";

@injectable()
export class CoreService {
  constructor(@inject(LatencyService) private latencyService: LatencyService) {}

  async handleLatency(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const repl = await interaction.editReply(
      await this.buildMessage(interaction),
    );

    const collector = createSafeCollector(repl, {
      filter: (i) => i.user.id === interaction.user.id,
    });

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;
      const handlers = {
        [CoreCustomIds.buttons.actions.refresh]: this.handleRefresh.bind(this),
      };

      return handlers[customId](interaction);
    });
  }

  private async handleRefresh(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    interaction.editReply(await this.buildMessage(interaction));
  }

  private async buildMessage(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ): Promise<InteractionEditReplyOptions> {
    const [ws, mongo] = [
      this.latencyService.wsLatency(interaction.client as Client),
      await this.latencyService.mongoLatency(),
    ];

    const container = new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL(
              UsersUtility.getAvatar(interaction.user),
            ),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                heading("Задержка бота", HeadingLevel.Two),
                unorderedList([
                  `${bold("Mongo:")} ${mongo}ms`,
                  `${bold("WS:")} ${ws}ms`,
                ]),
              ].join("\n"),
            ),
          ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents((actionRow) =>
        actionRow.addComponents(
          new ButtonBuilder()
            .setCustomId(CoreCustomIds.buttons.actions.refresh)
            .setLabel("Обновить")
            .setStyle(ButtonStyle.Secondary),
        ),
      );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }
}
