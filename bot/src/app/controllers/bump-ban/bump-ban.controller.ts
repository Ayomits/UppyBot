import { Events } from "discord.js";
import type { ArgsOf, Client } from "discordx";
import { Discord, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { BumpBanService } from "./bump-ban.service.js";

@Discord()
@singleton()
export class BumpBanController {
  constructor(@inject(BumpBanService) private bumpBanService: BumpBanService) {}

  @On({ event: Events.ClientReady })
  async onClientReady([client]: ArgsOf<Events.ClientReady>) {
    this.bumpBanService.handleBumpBanInit(client as Client);
  }

  @On({ event: Events.GuildMemberUpdate })
  async handleMemberUpdate([old, nw]: ArgsOf<Events.GuildMemberUpdate>) {
    if (old.roles.cache.size !== nw.roles.cache.size) {
      return this.bumpBanService.handleMemberUpdate(nw);
    }
  }
}
