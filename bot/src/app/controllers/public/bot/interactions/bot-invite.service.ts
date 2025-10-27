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

import { CoreInviteMessage } from "#/app/messages/bot-invite.message.js";
import { UppyLinks } from "#/const/links.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";

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

  protected buildResourcesLinks() {
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(CoreInviteMessage.embed.resources.support)
          .setStyle(ButtonStyle.Link)
          .setURL(UppyLinks.SupportServer),
        new ButtonBuilder()
          .setLabel(CoreInviteMessage.embed.resources.invite)
          .setStyle(ButtonStyle.Link)
          .setURL(UppyLinks.InviteBot),
        new ButtonBuilder()
          .setLabel(CoreInviteMessage.embed.resources.devs)
          .setStyle(ButtonStyle.Link)
          .setURL(UppyLinks.DevsTgc),
        new ButtonBuilder()
          .setLabel(CoreInviteMessage.embed.resources.news)
          .setStyle(ButtonStyle.Link)
          .setURL(UppyLinks.NewsTgc),
        new ButtonBuilder()
          .setLabel(CoreInviteMessage.embed.resources.docs)
          .setStyle(ButtonStyle.Link)
          .setURL(UppyLinks.DocsUrl),
      ),
    ];
  }
}
