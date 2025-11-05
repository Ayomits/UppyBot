import type { ChatInputCommandInteraction } from "discord.js";
import { ApplicationCommandOptionType } from "discord.js";
import {
  Discord,
  Guard,
  Slash,
  SlashChoice,
  SlashGroup,
  SlashOption,
} from "discordx";
import { inject, singleton } from "tsyringe";

import { developerGuilds } from "#/const/guilds.js";
import { SelectedGuildsOnly } from "#/guards/only-selected-guilds.js";

import { PremiumGiveService } from "./premium-give/give.service.js";

@Discord()
@singleton()
@SlashGroup({
  name: "dev",
  description: "Команды девелоперов",
  defaultMemberPermissions: ["Administrator"],
  dmPermission: false,
})
export class DevController {
  constructor(
    @inject(PremiumGiveService) private premiumGiveService: PremiumGiveService
  ) {}

  @Slash({
    name: "premium-give",
    description: "Выдать премиум подписку",
    defaultMemberPermissions: ["Administrator"],
    guilds: developerGuilds,
  })
  @Guard(SelectedGuildsOnly(developerGuilds))
  handleGiveCommand(
    @SlashChoice("hour", "day", "week", "month", "year")
    @SlashOption({
      name: "period",
      description: "Единицы измерения",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    period: string,
    @SlashOption({
      name: "amount",
      description: "Количество",
      type: ApplicationCommandOptionType.Number,
      required: true,
      minValue: 1,
    })
    amount: number,
    @SlashOption({
      name: "guild-id",
      description: "Айди сервера",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    guildId: string,
    interaction: ChatInputCommandInteraction
  ) {
    return this.premiumGiveService.handleGive(
      period,
      amount,
      guildId,
      interaction
    );
  }
}
