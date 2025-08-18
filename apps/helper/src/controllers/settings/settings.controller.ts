import type {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { Discord, ModalComponent, Slash } from "discordx";
import { inject, singleton } from "tsyringe";

import { HelperBotMessages } from "#/messages/index.js";

import { SettingsCustomIds } from "./settings.const.js";
import { SettingsService } from "./settings.service.js";

@Discord()
@singleton()
export class SettingsController {
  constructor(
    @inject(SettingsService) private settingsService: SettingsService,
  ) {}

  @Slash({
    name: HelperBotMessages.settings.command.name,
    description: HelperBotMessages.settings.command.description,
    defaultMemberPermissions: ["Administrator"],
  })
  handleSettings(interaction: ChatInputCommandInteraction) {
    return this.settingsService.handleSettingsCommand(interaction);
  }

  @ModalComponent({ id: SettingsCustomIds.modal.setForceTime })
  setForceTime(interaction: ModalSubmitInteraction) {
    return this.settingsService.handleSetForceModal(interaction);
  }
}
