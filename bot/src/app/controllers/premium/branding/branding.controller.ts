import type {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { Discord, Guard, ModalComponent, Slash } from "discordx";
import { inject, singleton } from "tsyringe";

import { PremiumOnly } from "#/app/guards/premium-only.guard.js";

import { BrandingChangeUrlModal } from "./branding.const.js";
import { BrandingService } from "./branding.service.js";

@Discord()
@singleton()
export class BrandingController {
  constructor(
    @inject(BrandingService) private brandingService: BrandingService
  ) {}

  @Slash({
    name: "branding",
    description: "Настройка брендинга в боте",
    defaultMemberPermissions: ["Administrator"],
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
}
