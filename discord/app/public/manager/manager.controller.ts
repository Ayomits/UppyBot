import type { ChatInputCommandInteraction } from "discord.js";
import { Discord, Slash, SlashGroup } from "discordx";
import { singleton } from "tsyringe";

import { ExternalLinks } from "#/discord/const/links.js";

@Discord()
@singleton()
@SlashGroup({ name: "manager", description: "Система с повышенными правами" })
@SlashGroup("manager")
export class ManagerController {
  @Slash({ name: "panel", description: "Панель менеджера" })
  handleManagerPanel(interaction: ChatInputCommandInteraction) {
    return interaction.reply({
      content: [
        "Эта фича выйдет pretty soon",
        "https://canary.discord.com/channels/1419608270959808554/1442618263728291982/1442618263728291982",
        ExternalLinks.SupportServer,
      ].join("\n"),
    });
  }
}
