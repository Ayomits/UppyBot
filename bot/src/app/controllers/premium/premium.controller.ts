import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  Events,
  type ModalSubmitInteraction,
} from "discord.js";
import {
  Discord,
  Guard,
  ModalComponent,
  On,
  Slash,
  SlashChoice,
  SlashGroup,
  SlashOption,
} from "discordx";
import { inject, singleton } from "tsyringe";

import { PremiumOnly } from "#/app/guards/premium-only.guard.js";
import { developerGuilds } from "#/const/guilds.js";

import { BrandingChangeUrlModal } from "./branding/branding.const.js";
import { BrandingService } from "./branding/branding.service.js";
import { PremiumGiveService } from "./give/give.service.js";
import { PremiumInfoService } from "./info/info.service.js";
import { PremiumSubscribeCommandService } from "./subscribe/subscribe.service.js";
import { PremiumSubscriptionManager } from "./subscription-manager/subscription.service.js";

@Discord()
@singleton()
@SlashGroup({ name: "premium", description: "Премиум возможности" })
@SlashGroup("premium")
export class PremiumController {
  constructor(
    @inject(BrandingService) private brandingService: BrandingService,
    @inject(PremiumSubscribeCommandService)
    private premiumSubscribeCommandService: PremiumSubscribeCommandService,
    @inject(PremiumInfoService) private premiumInfoService: PremiumInfoService,
    @inject(PremiumSubscriptionManager)
    private subscriptionService: PremiumSubscriptionManager,
    @inject(PremiumGiveService) private premiumGiveService: PremiumGiveService
  ) {}

  @Slash({
    name: "give",
    description: "Выдать премиум подписку",
    defaultMemberPermissions: ["Administrator"],
    guilds: developerGuilds,
  })
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

  @On({ event: Events.ClientReady })
  handleReady() {
    return this.subscriptionService.init();
  }

  @Slash({
    name: "branding",
    description: "Настройка брендинга в боте",
    defaultMemberPermissions: ["Administrator"],
    dmPermission: false,
  })
  @Guard(PremiumOnly)
  handleBranding(interaction: ChatInputCommandInteraction) {
    return this.brandingService.handleBrandingCommand(interaction);
  }

  @ModalComponent({ id: new RegExp(`${BrandingChangeUrlModal}_(.+)$`) })
  @Guard(PremiumOnly)
  handleBrandingChangeUrl(interaction: ModalSubmitInteraction) {
    return this.brandingService.handleChangeUrl(interaction);
  }

  @Slash({ name: "subscribe", description: "Информация о премиум подписке" })
  handleSubscribeCommand(interaction: ChatInputCommandInteraction) {
    return this.premiumSubscribeCommandService.handleSubscribeCommand(
      interaction
    );
  }

  @Slash({ name: "info", description: "Информация по премиуму на сервере" })
  handlePremiumInfoCommand(interaction: ChatInputCommandInteraction) {
    return this.premiumInfoService.handleInfo(interaction);
  }
}
