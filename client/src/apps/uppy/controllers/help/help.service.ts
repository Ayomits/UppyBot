import type { ChatInputCommandInteraction } from "discord.js";
import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
  unorderedList,
} from "discord.js";

import { Documentation } from "#/const/documentation.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";

export class UppyHelpService {
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
