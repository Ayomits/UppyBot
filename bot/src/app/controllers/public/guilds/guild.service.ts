import type { Client } from "discord.js";
import {
  ContainerBuilder,
  type Guild as DjsGuild,
  heading,
  HeadingLevel,
  MessageFlags,
} from "discord.js";
import { injectable } from "tsyringe";

import { UsersUtility } from "#/libs/embed/users.utility.js";
import type { Guild } from "#/models/guild.model.js";
import { GuildModel, GuildType } from "#/models/guild.model.js";

import { BotInviteService } from "../bot/interactions/bot-invite.service.js";

@injectable()
export class GuildService extends BotInviteService {
  async handleGuildSync(client: Client) {
    const guilds = await client.guilds.fetch().catch(() => null);
    if (!guilds) {
      return;
    }

    const ids = guilds.map((g) => g.id);
    this.syncGuilds(ids);
  }

  private async syncGuilds(ids: string[]) {
    const guilds = (await GuildModel.find({ guildId: { $in: ids } })).map(
      (g) => g.guildId,
    );
    const docs: Guild[] = ids
      .filter((g) => !guilds.includes(g))
      .map((g) => ({
        guildId: g,
        isActive: true,
        type: GuildType.Common,
      }));

    await GuildModel.insertMany(docs);
  }

  async handleGuildCreation(guild: DjsGuild) {
    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { isActive: true },
      { upsert: true },
    );
    this.postGuildCreation(guild);
  }

  private async postGuildCreation(guild: DjsGuild) {
    const owner = await guild.members.fetch(guild.ownerId);

    const container = new ContainerBuilder()
      .addSectionComponents((builder) =>
        builder
          .setThumbnailAccessory((builder) =>
            builder.setURL(UsersUtility.getAvatar(guild.client.user)),
          )
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [
                heading("Спасибо, что добавили", HeadingLevel.One),
                "",
                "Мы уверены, что этот бот поможет стать вашему серверу лучше !",
              ].join("\n"),
            ),
          ),
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

  async handleGuildRemoval(guild: DjsGuild) {
    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { isActive: false },
    );
  }
}
