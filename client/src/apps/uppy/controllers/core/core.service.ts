import type {
  ButtonInteraction,
  InteractionEditReplyOptions,
} from "discord.js";
import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
  SectionBuilder,
  unorderedList,
} from "discord.js";
import type { Client } from "discordx";
import { inject, injectable } from "tsyringe";

import { Documentation } from "#/const/documentation.js";
import { inviteBot, newsTgc, supportServer } from "#/const/links.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";
import { createSafeCollector } from "#/libs/utils/collector.js";
import { LatencyService } from "#/shared/services/latency.service.js";

import { CoreInviteMessage } from "../../messages/core-invite.message.js";
import { UppyCoreCustomIds } from "./core.const.js";

@injectable()
export class UppyCoreService {
  constructor(@inject(LatencyService) private latencyService: LatencyService) {}

  // =========core latency============
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
      this.latencyService.wsLatency(interaction.client as Client),
      await this.latencyService.mongoLatency(),
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
                  `${bold("Mongo:")} ${mongo}ms`,
                  `${bold("WS:")} ${ws}ms`,
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

  // ========core invite========
  async handleInviteCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const container = new ContainerBuilder()
      .addSectionComponents((builder) =>
        builder
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [
                heading(CoreInviteMessage.embed.title, HeadingLevel.Two),
                "",
                CoreInviteMessage.embed.description,
              ].join("\n"),
            ),
          )
          .setThumbnailAccessory((builder) =>
            builder.setURL(UsersUtility.getAvatar(interaction.user)),
          ),
      )
      .addSeparatorComponents((builder) => builder.setDivider(true))
      .addActionRowComponents(this.buildResourcesLinks());

    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }

  private buildResourcesLinks() {
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(CoreInviteMessage.embed.resources.support)
          .setStyle(ButtonStyle.Link)
          .setURL(supportServer),
        new ButtonBuilder()
          .setLabel(CoreInviteMessage.embed.resources.invite)
          .setStyle(ButtonStyle.Link)
          .setURL(inviteBot),
        new ButtonBuilder()
          .setLabel(CoreInviteMessage.embed.resources.news)
          .setStyle(ButtonStyle.Link)
          .setURL(newsTgc),
      ),
    ];
  }

  // =========core help========
  async handleHelpCommand(
    interaction: ChatInputCommandInteraction,
    topic: string,
  ) {
    await interaction.deferReply();
    const idx = Number(topic);

    if (Number.isNaN(idx)) {
      return interaction.editReply({
        content: "Такого топика нет",
      });
    }

    const theme = Documentation[idx];

    if (!theme) {
      return interaction.editReply({
        content: "Такого топика нет",
      });
    }

    function normalizeDocs(label: string, value?: string) {
      if (!value) return null;
      return [heading(label, HeadingLevel.Two), value].join("\n");
    }

    function normalizeLinks() {
      const links = theme.meta.links!;

      if (!links.length) return [];

      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      const maxButtonsPerRow = 5;

      for (let i = 0; i < links.length; i += maxButtonsPerRow) {
        const rowLinks = links.slice(i, i + maxButtonsPerRow);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          rowLinks.map((link) =>
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel(link.name)
              .setURL(link.url),
          ),
        );

        rows.push(row);
      }

      return rows.slice(0, maxButtonsPerRow);
    }

    const container = new ContainerBuilder().addSectionComponents((builder) =>
      builder
        .setThumbnailAccessory((builder) =>
          builder.setURL(UsersUtility.getAvatar(interaction.user)),
        )
        .addTextDisplayComponents((builder) =>
          builder.setContent(
            [
              heading(theme.name),
              unorderedList([
                `${bold("Категория:")} ${theme.category}`,
                `${theme.meta.summary}`,
              ]),
              normalizeDocs("Информация", theme.meta?.info),
              normalizeDocs("Как использовать", theme.meta?.usage),
              normalizeDocs("Аргументы", theme.meta?.args),
              normalizeDocs("Дополнительно", theme.meta?.addition),
            ]
              .filter(Boolean)
              .join("\n"),
          ),
        ),
    );

    if (theme.meta?.links && theme.meta.links.length) {
      container.addActionRowComponents(normalizeLinks());
    }

    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
