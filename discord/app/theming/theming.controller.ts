import { Events } from "discord.js";
import type { ArgsOf } from "discordx";
import { Discord, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { ThemingService } from "./theming.service.js";

@Discord()
@singleton()
export class ThemingController {
  constructor(@inject(ThemingService) private themingService: ThemingService) {}

  @On({ event: Events.ClientReady })
  handleInitLocal([client]: ArgsOf<Events.ClientReady>) {
    this.themingService.handleInitLocal(client);
    this.themingService.handleInitGlobal();
  }
}
