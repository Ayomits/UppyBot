import type {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { Discord, Guard, ModalComponent, Slash, SlashGroup } from "discordx";
import { inject, singleton } from "tsyringe";

import { PremiumOnly } from "#/app/guards/premium-only.guard.js";

import { BrandingChangeUrlModal } from "./branding/branding.const.js";
import { BrandingService } from "./branding/branding.service.js";
import { PremiumInfoService } from "./subscribe/subscribe.service.js";

@Discord()
@singleton()
@SlashGroup({ name: "premium", description: "Премиум возможности" })
@SlashGroup("premium")
export class PremiumController {
  constructor(
    @inject(BrandingService) private brandingService: BrandingService,
    @inject(PremiumInfoService) private premiumInfoService: PremiumInfoService,
  ) {}

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
  handlePremiumInfo(interaction: ChatInputCommandInteraction) {
    return this.premiumInfoService.handleInfoCommand(interaction);
  }
}
