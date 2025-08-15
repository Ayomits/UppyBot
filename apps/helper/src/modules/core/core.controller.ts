import { Events } from "discord.js";
import { Discord, Once } from "discordx";
import { inject, singleton } from "tsyringe";

import { CoreService } from "./core.service.js";

@singleton()
@Discord()
export class CoreController {
  constructor(@inject(CoreService) private coreService: CoreService) {}

  @Once({ event: Events.ClientReady })
  onReady() {
    return this.coreService.handleReady();
  }
}
