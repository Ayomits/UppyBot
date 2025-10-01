import { type ChatInputCommandInteraction } from "discord.js";
import { Discord, Slash, SlashGroup } from "discordx";
import { inject, singleton } from "tsyringe";

import { UppyBotInviteService } from "./interactions/bot-invite.service.js";
import { UppyBotPingService } from "./interactions/bot-ping.service.js";
import { UppyBotStatsService } from "./interactions/bot-stats.service.js";

@Discord()
@singleton()
@SlashGroup({ name: "bot", description: "Команды бота" })
@SlashGroup("bot")
export class UppyCoreController {
  constructor(
    @inject(UppyBotPingService) private pingService: UppyBotPingService,
    @inject(UppyBotInviteService) private inviteService: UppyBotInviteService,
    @inject(UppyBotStatsService) private statService: UppyBotStatsService,
  ) {}

  @Slash({ name: "ping", description: "Задержка бота" })
  handlePing(interaction: ChatInputCommandInteraction) {
    return this.pingService.handleLatencyCommand(interaction);
  }

  @Slash({ name: "latency", description: "Задержка бота" })
  handleLatency(interaction: ChatInputCommandInteraction) {
    return this.pingService.handleLatencyCommand(interaction);
  }

  @Slash({ name: "invite", description: "Приглашение на сервер поддержки" })
  handleInvite(interaction: ChatInputCommandInteraction) {
    return this.inviteService.handleInviteCommand(interaction);
  }

  @Slash({ name: "stats", description: "Статистика бота" })
  handleStats(interaction: ChatInputCommandInteraction) {
    return this.statService.handleStats(interaction);
  }
}
