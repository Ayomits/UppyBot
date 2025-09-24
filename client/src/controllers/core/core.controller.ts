import { Events } from "discord.js";
import type { ArgsOf, Client } from "discordx";
import { Discord, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { CoreService } from "./core.service.js";

@Discord()
@singleton()
export class CoreController {
  constructor(@inject(CoreService) private coreService: CoreService) {}

  @On({ event: Events.ClientReady })
  onReady([client]: ArgsOf<Events.ClientReady>) {
    return this.coreService.handleReady(client as Client);
  }
}
