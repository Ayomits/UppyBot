/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type ButtonInteraction,
  type ChannelSelectMenuInteraction,
  type ChatInputCommandInteraction,
  type Interaction,
  type RoleSelectMenuInteraction,
} from "discord.js";
import { injectable } from "tsyringe";

@injectable()
export class BumpReminderSettingsService {
  constructor() {}

  public async handleSettings(interaction: ChatInputCommandInteraction) {}

  private async handleRefreshMessage(interaction: ButtonInteraction) {}

  private async handleToggleModuleState(interaction: ButtonInteraction) {}

  private async handleSetPingChannels(
    interaction: ChannelSelectMenuInteraction,
  ) {}

  private async handleSetBumpBanRole(interaction: RoleSelectMenuInteraction) {}

  private async createSettingsMessage(interaction: Interaction) {}
}
