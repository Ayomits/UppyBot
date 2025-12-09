import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  Events,
} from "discord.js";
import { Discord, On, Slash, SlashGroup, SlashOption } from "discordx";
import { inject, singleton } from "tsyringe";

import { PremiumActivatePromocodeService } from "./activate/activate.service.js";
import { PremiumInfoService } from "./info/info.service.js";
import { PremiumSubscribeCommandService } from "./subscribe/subscribe.service.js";
import { PremiumSubscriptionManager } from "./subscription-manager/subscription.service.js";

@Discord()
@singleton()
@SlashGroup({ name: "premium", description: "Премиум возможности" })
@SlashGroup("premium")
export class PremiumController {
  constructor(
    @inject(PremiumSubscribeCommandService)
    private premiumSubscribeCommandService: PremiumSubscribeCommandService,
    @inject(PremiumInfoService) private premiumInfoService: PremiumInfoService,
    @inject(PremiumSubscriptionManager)
    private subscriptionService: PremiumSubscriptionManager,
    @inject(PremiumActivatePromocodeService)
    private premiumActivatePromocodeService: PremiumActivatePromocodeService,
  ) {}

  @On({ event: Events.ClientReady })
  handleReady() {
    return this.subscriptionService.init();
  }

  @Slash({ name: "subscribe", description: "Информация о премиум подписке" })
  handleSubscribeCommand(interaction: ChatInputCommandInteraction) {
    return this.premiumSubscribeCommandService.handleSubscribeCommand(
      interaction,
    );
  }

  @Slash({ name: "activate", description: "Активировать промокод" })
  handleActivateCommand(
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "code",
      description: "Название промокода",
      required: true,
    })
    code: string,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.premiumActivatePromocodeService.handleActivatePromocode(
      code,
      interaction,
    );
  }

  @Slash({ name: "info", description: "Информация по премиуму на сервере" })
  handlePremiumInfoCommand(interaction: ChatInputCommandInteraction) {
    return this.premiumInfoService.handleInfo(interaction);
  }
}
