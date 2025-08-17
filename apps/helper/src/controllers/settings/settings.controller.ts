import type { ChatInputCommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";
import { inject, singleton } from "tsyringe";

import { HelperBotMessages } from "#/messages/index.js";

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
}
