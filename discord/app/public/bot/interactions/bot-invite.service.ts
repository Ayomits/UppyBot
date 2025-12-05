import type { ChatInputCommandInteraction } from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
} from "discord.js";
import { injectable } from "tsyringe";

import { ExternalLinks } from "#/discord/const/links.js";
import { UsersUtility } from "#/shared/libs/embed/users.utility.js";

@injectable()
export class BotInviteService {
  async handleInviteCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const container = new ContainerBuilder()
      .addSectionComponents((builder) =>
        builder
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [
                heading("Основные ресурсы бота", HeadingLevel.Two),
                "",
                "Ниже вы сможете найти все официальные ресурсы связанные с Uppy",
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

  buildResourcesLinks() {
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Сервер поддержки")
          .setStyle(ButtonStyle.Link)
          .setURL(ExternalLinks.SupportServer),
        new ButtonBuilder()
          .setLabel("Разработчики тгк")
          .setStyle(ButtonStyle.Link)
          .setURL(ExternalLinks.DevsTgc),
        new ButtonBuilder()
          .setLabel("Новостной тгк")
          .setStyle(ButtonStyle.Link)
          .setURL(ExternalLinks.DevsTgc),
        new ButtonBuilder()
          .setLabel("Добавить бота")
          .setStyle(ButtonStyle.Link)
          .setURL(ExternalLinks.InviteBot),
        new ButtonBuilder()
          .setLabel("Документация")
          .setStyle(ButtonStyle.Link)
          .setURL(ExternalLinks.DocsUrl),
      ),
    ];
  }
}
