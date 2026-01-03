import { IsGuildUser } from "@discordx/utilities";
import type {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { Discord, Guard, ModalComponent, Slash, SlashGroup } from "discordx";
import { inject, singleton } from "tsyringe";

import { developerGuilds } from "#/discord/const/guilds.js";
import { SelectedGuildsOnly } from "#/discord/guards/only-selected-guilds.js";

import { DevIds } from "./dev.const.js";
import { DevPanelService } from "./panel.service.js";

@singleton()
@Discord()
@SlashGroup({
  name: "dev",
  description: "Для разработчиков",
  dmPermission: false,
})
@SlashGroup("dev")
export class DevController {
  constructor(
    @inject(DevPanelService) private devPanelService: DevPanelService,
  ) {}

  @Slash({
    name: "panel",
    description: "Панель разработчика",
    defaultMemberPermissions: ["Administrator"],
  })
  @Guard(IsGuildUser(SelectedGuildsOnly(developerGuilds)))
  async handleDevPanel(interaction: ChatInputCommandInteraction) {
    return this.devPanelService.handlePanel(interaction);
  }

  @ModalComponent({
    id: new RegExp(`${DevIds.promocodes.create}|${DevIds.promocodes.revoke}`),
  })
  @Guard(IsGuildUser(SelectedGuildsOnly(developerGuilds)))
  handlePromocodeModal(interaction: ModalSubmitInteraction) {
    return this.devPanelService.handlePromocodeModal(interaction);
  }

  @ModalComponent({
    id: new RegExp(`${DevIds.premium.assign}|${DevIds.premium.revoke}`),
  })
  @Guard(IsGuildUser(SelectedGuildsOnly(developerGuilds)))
  handlePremiumModal(interaction: ModalSubmitInteraction) {
    return this.devPanelService.handlePremiumModal(interaction);
  }
}
