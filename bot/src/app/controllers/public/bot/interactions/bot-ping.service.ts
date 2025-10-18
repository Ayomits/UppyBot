import { mongoose } from "@typegoose/typegoose";
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
import { injectable } from "tsyringe";

import { UsersUtility } from "#/libs/embed/users.utility.js";
import { createSafeCollector } from "#/libs/utils/collector.js";

import { UppyCoreCustomIds } from "../bot.const.js";

@injectable()
export class UppyBotPingService {
  async handleLatencyCommand(interaction: ChatInputCommandInteraction) {
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
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ): Promise<InteractionEditReplyOptions> {
    const [ws, mongo] = [
      this.wsLatency(interaction.client as Client),
      await this.mongoLatency(),
    ];

    const container = new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
          .setThumbnailAccessory((builder) =>
            builder.setURL(UsersUtility.getAvatar(interaction.user)),
          )
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [
                heading("Задержка бота", HeadingLevel.Two),
                unorderedList([
                  `${bold("Db:")} ${mongo}ms`,
                  `${bold("Ws:")} ${ws}ms`,
                ]),
              ].join("\n"),
            ),
          ),
      )
      .addSeparatorComponents((builder) => builder.setDivider(true))
      .addActionRowComponents((row) =>
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(UppyCoreCustomIds.buttons.actions.refresh)
            .setLabel("Обновить")
            .setStyle(ButtonStyle.Secondary),
        ),
      );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  private async mongoLatency() {
    const start = Date.now();
    try {
      const admin = mongoose.connection.db?.admin();
      const ping = await admin?.ping();
      if (!ping?.ok) {
        return -1;
      }
      return Math.max(Date.now() - start, 1);
    } catch {
      return -1;
    }
  }

  private wsLatency(client: Client) {
    return Math.max(client.ws.ping, 1);
  }
}
