import { IsGuildUser } from "@discordx/utilities";
import type {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { Discord, Guard, ModalComponent, Slash } from "discordx";
import { inject, singleton } from "tsyringe";

import { GuildOnly } from "#/discord/guards/is-guild-only.js";
import { PremiumOnly } from "#/discord/guards/premium-only.guard.js";

import {
  brandinModalId,
  forceModalId,
  pointModalId,
  templateModalId,
} from "./settings.const.js";
import { SettingsService } from "./settings.service.js";
import { SettingsModalService } from "./settings-modals.service.js";

@Discord()
@singleton()
export class SettingsController {
  constructor(
    @inject(SettingsService) private settingsService: SettingsService,
    @inject(SettingsModalService) private settingsModals: SettingsModalService,
  ) {}

  @Slash({
    name: "settings",
    description: "Настроить бота",
    defaultMemberPermissions: ["Administrator"],
    dmPermission: false,
  })
  @Guard(IsGuildUser(GuildOnly))
  handleSettings(interaction: ChatInputCommandInteraction) {
    return this.settingsService.handleSettingsCommand(interaction);
  }

  @ModalComponent({ id: new RegExp(`${pointModalId}_(.+)$`) })
  handlePoints(interaction: ModalSubmitInteraction) {
    return this.settingsModals.handlePointsModal(interaction);
  }

  @ModalComponent({ id: forceModalId })
  handleForce(interaction: ModalSubmitInteraction) {
    return this.settingsModals.handleForceModal(interaction);
  }

  @ModalComponent({ id: new RegExp(`${templateModalId}_(.+)$`) })
  @Guard(PremiumOnly)
  handleTemplate(interaction: ModalSubmitInteraction) {
    return this.settingsModals.handleTemplateModal(interaction);
  }

  @ModalComponent({ id: new RegExp(`${brandinModalId}_(.+)$`) })
  @Guard(PremiumOnly)
  handleBranding(interaction: ModalSubmitInteraction) {
    return this.settingsModals.handleBrandingModal(interaction);
  }
}
