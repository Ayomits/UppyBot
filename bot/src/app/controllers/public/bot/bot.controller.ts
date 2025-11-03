import {
  ActivityType,
  type ChatInputCommandInteraction,
  Events,
} from "discord.js";
import type { ArgsOf } from "discordx";
import { Discord, On, Slash, SlashGroup } from "discordx";
import { inject, singleton } from "tsyringe";

import { ExternalLinks } from "#/const/links.js";

import { BotInviteService } from "./interactions/bot-invite.service.js";
import { UppyBotPingService } from "./interactions/bot-ping.service.js";

@Discord()
@singleton()
@SlashGroup({ name: "bot", description: "Команды бота" })
@SlashGroup("bot")
export class UppyCoreController {
  constructor(
    @inject(UppyBotPingService) private pingService: UppyBotPingService,
    @inject(BotInviteService) private inviteService: BotInviteService,
  ) {}

  @On({ event: Events.ClientReady })
  handleReady([client]: ArgsOf<Events.ClientReady>) {
    client.user.setActivity({
      type: ActivityType.Custom,
      name: ExternalLinks.NewsTgc,
    });
  }

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
}
