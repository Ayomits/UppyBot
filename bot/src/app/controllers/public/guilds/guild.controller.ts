import { Events } from "discord.js";
import type { ArgsOf } from "discordx";
import { Discord, On } from "discordx";
import { singleton } from "tsyringe";

import { guildCreate, guildDelete, syncGuilds } from "#/api/queries/guilds.js";

@Discord()
@singleton()
export class GuildController {
  @On({ event: Events.ClientReady })
  async handleReady([client]: ArgsOf<Events.ClientReady>) {
    const guilds = await client.guilds.fetch().catch(() => null);
    if (!guilds) {
      return;
    }

    const ids = guilds.map((g) => g.id);
    await syncGuilds({ ids });
  }

  @On({ event: Events.GuildCreate })
  async handleGuildCreate([guild]: ArgsOf<Events.GuildCreate>) {
    await guildCreate(guild.id);
  }

  @On({ event: Events.GuildDelete })
  async handleGuildDelete([guild]: ArgsOf<Events.GuildDelete>) {
    await guildDelete(guild.id);
  }
}
