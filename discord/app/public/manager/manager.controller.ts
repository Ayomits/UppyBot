import { IsGuildUser } from "@discordx/utilities";
import type {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { Discord, Guard, ModalComponent, Slash, SlashGroup } from "discordx";
import { inject, singleton } from "tsyringe";

import { IsManager } from "#/discord/guards/is-manager.js";

import { ManagerPanelIds } from "./manager.const.js";
import { ManagerService } from "./manager.service.js";

@Discord()
@singleton()
@SlashGroup({ name: "manager", description: "Система с повышенными правами" })
@SlashGroup("manager")
export class ManagerController {
  constructor(@inject(ManagerService) private managerService: ManagerService) {}

  @Slash({ name: "panel", description: "Панель менеджера" })
  @Guard(IsGuildUser(IsManager))
  handleManagerPanel(interaction: ChatInputCommandInteraction) {
    return this.managerService.handleManagerPanel(interaction);
  }

  @ModalComponent({ id: new RegExp(`${ManagerPanelIds.modal}_(.+)$`) })
  @Guard(IsGuildUser(IsManager))
  handleComponent(interaction: ModalSubmitInteraction) {
    return this.managerService.handleManagerModal(interaction);
  }
}
