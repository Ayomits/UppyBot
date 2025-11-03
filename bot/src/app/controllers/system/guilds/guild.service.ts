import type { Client } from "discord.js";
import {
  ContainerBuilder,
  type Guild as DjsGuild,
  heading,
  HeadingLevel,
  MessageFlags,
} from "discord.js";
import { inject, injectable } from "tsyringe";

import type { Guild} from "#/db/models/guild.model.js";
import { GuildType } from "#/db/models/guild.model.js";
import { GuildRepository } from "#/db/repositories/guild.repository.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";

import { BotInviteService } from "../../public/bot/interactions/bot-invite.service.js";

@injectable()
export class GuildService {
  constructor(
    @inject(BotInviteService) private botInviteService: BotInviteService,
    @inject(GuildRepository) private guildRepository: GuildRepository
  ) {}

  async handleGuildSync(client: Client) {
    const guilds = await client.guilds.fetch().catch(() => null);
    if (!guilds) {
      return;
    }

    const ids = guilds.map((g) => g.id);
    this.syncGuilds(ids);
  }

  private async syncGuilds(ids: string[]) {
    const guilds = (
      await this.guildRepository.findMany({ guildId: { $in: ids } })
    ).map((g) => g.guildId);
    const docs: Guild[] = ids
      .filter((g) => !guilds.includes(g))
      .map((g) => ({
        guildId: g,
        isActive: true,
        type: GuildType.Common,
      }));

    await this.guildRepository.createMany(docs);
  }

  async handleGuildCreation(guild: DjsGuild) {
    await this.guildRepository.update(guild.id, { isActive: true });
    this.postGuildCreation(guild);
  }

  private async postGuildCreation(guild: DjsGuild) {
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
      .addActionRowComponents(this.botInviteService.buildResourcesLinks());

    await owner
      .send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(console.error);
  }

  async handleGuildRemoval(guild: DjsGuild) {
    await this.guildRepository.update(guild.id, { isActive: false });
  }
}
