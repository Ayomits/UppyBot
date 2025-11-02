import { IsGuildUser } from "@discordx/utilities";
import type {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { Discord, Guard, ModalComponent, Slash } from "discordx";
import { inject, singleton } from "tsyringe";

import { GuildOnly } from "#/guards/is-guild-only.js";

import { basePointsId, forceModalId } from "./settings.const.js";
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

  @ModalComponent({ id: new RegExp(`${basePointsId}_(.+)$`) })
  handlePoints(interaction: ModalSubmitInteraction) {
    return this.settingsModals.handlePointsModal(interaction);
  }

  @ModalComponent({ id: forceModalId })
  handleForce(interaction: ModalSubmitInteraction) {
    return this.settingsModals.handleForceModal(interaction);
  }
}
