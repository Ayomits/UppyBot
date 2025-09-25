import { type ChatInputCommandInteraction } from "discord.js";
import { Discord, Slash, SlashGroup } from "discordx";
import { inject, singleton } from "tsyringe";

import { CoreService } from "./core.service.js";

@Discord()
@singleton()
@SlashGroup({ name: "core", description: "Команды бота" })
@SlashGroup("core")
export class CoreController {
  constructor(@inject(CoreService) private coreService: CoreService) {}

  @Slash({ name: "latency", description: "Задержка бота" })
  handleLatency(interaction: ChatInputCommandInteraction) {
    return this.coreService.handleLatency(interaction);
  }

  @Slash({ name: "info", description: "Информация о боте" })
  handleInfo() {}

  @Slash({ name: "invite", description: "Приглашение на сервер поддержки" })
  handleInvite() {}
}
