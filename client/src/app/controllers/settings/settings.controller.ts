import { IsGuildUser } from "@discordx/utilities";
import type {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { Discord, Guard, ModalComponent, Slash } from "discordx";
import { inject, singleton } from "tsyringe";

import { GuildOnly } from "#/guards/is-guild-only.js";

import { SettingsCustomIds } from "./settings.const.js";
import { SettingsService } from "./settings.service.js";

@Discord()
@singleton()
export class SettingsController {
  constructor(
    @inject(SettingsService) private settingsService: SettingsService,
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

  @ModalComponent({ id: SettingsCustomIds.modal.setForceTime })
  @Guard(IsGuildUser(GuildOnly))
  setForceTime(interaction: ModalSubmitInteraction) {
    return this.settingsService.handleSetForceModal(interaction);
  }

  @ModalComponent({
    id: new RegExp(`^${SettingsCustomIds.modal.manageAward}_(\\d+)$`),
  })
  @Guard(IsGuildUser(GuildOnly))
  handleAwardManageModal(interaction: ModalSubmitInteraction) {
    return this.settingsService.handleAwardManagmentModal(interaction);
  }
}
