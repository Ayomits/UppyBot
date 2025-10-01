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

import { CoreInviteMessage } from "#/apps/uppy/messages/core-invite.message.js";
import { inviteBot, newsTgc, supportServer } from "#/const/links.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";

@injectable()
export class UppyBotInviteService {
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
              ].join("\n")
            )
          )
          .setThumbnailAccessory((builder) =>
            builder.setURL(UsersUtility.getAvatar(interaction.user))
          )
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
          .setURL(newsTgc)
      ),
    ];
  }
}
