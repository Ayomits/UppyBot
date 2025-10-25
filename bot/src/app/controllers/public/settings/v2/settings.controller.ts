import { IsGuildUser } from "@discordx/utilities";
import type { ChatInputCommandInteraction } from "discord.js";
import { Discord, Guard, Slash } from "discordx";
import { inject, singleton } from "tsyringe";

import { GuildOnly } from "#/guards/is-guild-only.js";

import { SettingsService } from "./settings.service.js";

@Discord()
@singleton()
export class SettingsController {
  constructor(
    @inject(SettingsService) private settingsService: SettingsService,
  ) {}

  @Slash({
    name: "settings-v2",
    description: "Настроить бота",
    defaultMemberPermissions: ["Administrator"],
    dmPermission: false,
  })
  @Guard(IsGuildUser(GuildOnly))
  handleSettings(interaction: ChatInputCommandInteraction) {
    return this.settingsService.handleSettingsCommand(interaction);
  }
}
