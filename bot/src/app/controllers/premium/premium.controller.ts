import {
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
  SlashGroup,
} from "discordx";
import { inject, singleton } from "tsyringe";

import { PremiumOnly } from "#/guards/premium-only.guard.js";

import { BrandingChangeUrlModal } from "./branding/branding.const.js";
import { BrandingService } from "./branding/branding.service.js";
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
  ) {}

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
