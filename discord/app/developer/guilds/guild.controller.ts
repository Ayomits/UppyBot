import { Events } from "discord.js";
import type { ArgsOf, Client } from "discordx";
import { Discord, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { GuildService } from "./guild.service.js";

@Discord()
@singleton()
export class GuildController {
  constructor(@inject(GuildService) private guildService: GuildService) {}

  @On({ event: Events.ClientReady })
  async handleReady([client]: ArgsOf<Events.ClientReady>) {
    return this.guildService.handleGuildSync(client as Client);
  }

  @On({ event: Events.GuildCreate })
  async handleGuildCreate([guild]: ArgsOf<Events.GuildCreate>) {
    return this.guildService.handleGuildCreation(guild);
  }

  @On({ event: Events.GuildUpdate })
  async handleGuildUpdate([, guild]: ArgsOf<Events.GuildUpdate>) {
    return this.guildService.handleGuildUpdate(guild);
  }

  @On({ event: Events.GuildDelete })
  async handleGuildDelete([guild]: ArgsOf<Events.GuildDelete>) {
    return this.guildService.handleGuildRemoval(guild);
  }
}
