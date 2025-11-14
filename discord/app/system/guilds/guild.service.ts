import {
  ContainerBuilder,
  type Guild as DjsGuild,
  heading,
  HeadingLevel,
  MessageFlags,
} from "discord.js";
import type { Client } from "discordx";
import type mongoose from "mongoose";
import { inject, injectable } from "tsyringe";

import type { Guild } from "#/shared/db/models/uppy-discord/guild.model.js";
import {
  GuildModel,
  GuildType,
} from "#/shared/db/models/uppy-discord/guild.model.js";
import { GuildRepository } from "#/shared/db/repositories/uppy-discord/guild.repository.js";
import { UsersUtility } from "#/shared/libs/embed/users.utility.js";

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

    const input = guilds.map((g) => ({ name: g.name, id: g.id }));
    this.syncGuilds(input);
  }

  private async syncGuilds(input: { name: string; id: string }[]) {
    const ids = input.map((g) => g.id);

    const existingGuilds = await this.guildRepository.findMany({
      guildId: { $in: ids },
    });

    const existingGuildIds = existingGuilds.map((g) => g.guildId);

    const operations: mongoose.AnyBulkWriteOperation<Guild>[] = [];

    for (const guild of input) {
      if (existingGuildIds.includes(guild.id)) {
        operations.push({
          updateOne: {
            filter: { guildId: guild.id },
            update: {
              $set: {
                guildName: guild.name,
                isActive: true,
              },
            },
          },
        });
      } else {
        operations.push({
          insertOne: {
            document: {
              guildId: guild.id,
              guildName: guild.name,
              isActive: true,
              type: GuildType.Common,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Guild,
          },
        });
      }
    }

    const missingGuildIds = existingGuilds
      .filter((g) => !ids.includes(g.guildId))
      .map((g) => g.guildId);

    if (missingGuildIds.length > 0) {
      operations.push({
        updateMany: {
          filter: { guildId: { $in: missingGuildIds } },
          update: {
            $set: { isActive: false },
          },
        },
      });
    }

    if (operations.length > 0) {
      await GuildModel.bulkWrite(operations);
    }
  }

  async handleGuildCreation(guild: DjsGuild) {
    await this.guildRepository.update(guild.id, {
      guildName: guild.name,
      isActive: true,
    });
    this.postGuildCreation(guild);
  }

  async handleGuildUpdate(guild: DjsGuild) {
    await this.guildRepository.update(guild.id, {
      guildName: guild.name,
      isActive: true,
    });
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
