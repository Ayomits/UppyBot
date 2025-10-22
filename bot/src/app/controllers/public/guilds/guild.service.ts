import type { Client } from "discord.js";
import {
  ContainerBuilder,
  type Guild,
  heading,
  HeadingLevel,
  MessageFlags,
} from "discord.js";
import { injectable } from "tsyringe";

import { guildCreate, guildDelete, syncGuilds } from "#/api/queries/guilds.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";

import { BotInviteService } from "../bot/interactions/bot-invite.service.js";

@injectable()
export class GuildService extends BotInviteService {
  async handleGuildSync(client: Client) {
    const guilds = await client.guilds.fetch().catch(() => null);
    if (!guilds) {
      return;
    }

    const ids = guilds.map((g) => g.id);
    await syncGuilds({ ids });
  }

  async handleGuildCreation(guild: Guild) {
    await guildCreate(guild.id);
    this.postGuildCreation(guild);
  }

  private async postGuildCreation(guild: Guild) {
    const owner = await guild.members.fetch(guild.ownerId);

    const container = new ContainerBuilder()
      .addSectionComponents((builder) =>
        builder
          .setThumbnailAccessory((builder) =>
            builder.setURL(UsersUtility.getAvatar(guild.client.user))
          )
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [
                heading("Спасибо, что добавили", HeadingLevel.One),
                "",
                "Мы уверены, что этот бот поможет стать вашему серверу лучше !",
              ].join("\n")
            )
          )
      )
      .addSeparatorComponents((builder) => builder.setDivider(true))
      .addActionRowComponents(this.buildResourcesLinks());

    await owner
      .send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(console.error);
  }

  async handleGuildRemoval(guild: Guild) {
    await guildDelete(guild.id);
  }
}
