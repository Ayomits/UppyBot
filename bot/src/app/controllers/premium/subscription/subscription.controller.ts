import type { ChatInputCommandInteraction } from "discord.js";
import { ApplicationCommandOptionType, Events } from "discord.js";
import {
  Discord,
  Guild,
  On,
  Slash,
  SlashChoice,
  SlashGroup,
  SlashOption,
} from "discordx";
import { inject, singleton } from "tsyringe";

import { developerGuilds } from "#/const/guilds.js";

import { PremiumGiveService } from "../give/give.service.js";
import { PremiumSubscriptionManager } from "./subscription.service.js";

@Discord()
@singleton()
@SlashGroup({ name: "subscription", description: "Подписки" })
@SlashGroup("subscription")
export class SubscriptionController {
  constructor(
    @inject(PremiumSubscriptionManager)
    private subscriptionService: PremiumSubscriptionManager,
    @inject(PremiumGiveService) private premiumGiveService: PremiumGiveService,
  ) {}

  @Slash({
    name: "give",
    description: "Выдать премиум подписку",
    defaultMemberPermissions: ["Administrator"],
  })
  @Guild(developerGuilds)
  handleGiveCommand(
    @SlashChoice("hour", "day", "week", "month", "half year", "yearu")
    @SlashOption({
      name: "period",
      description: "На сколько выдать",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    period: string,
    @SlashOption({
      name: "guild-id",
      description: "айди сервера",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    guildId: string,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.premiumGiveService.handleGive(period, guildId, interaction);
  }

  @On({ event: Events.ClientReady })
  handleReady() {
    return this.subscriptionService.init();
  }
}
