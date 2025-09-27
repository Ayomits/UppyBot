import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { inject, singleton } from "tsyringe";

import { Documentation } from "#/const/documentation.js";

import { CoreService } from "./core.service.js";

@Discord()
@singleton()
@SlashGroup({ name: "core", description: "Команды бота" })
@SlashGroup("core")
export class CoreController {
  constructor(@inject(CoreService) private coreService: CoreService) {}

  @Slash({ name: "latency", description: "Задержка бота" })
  handleLatency(interaction: ChatInputCommandInteraction) {
    return this.coreService.handleLatencyCommand(interaction);
  }

  @Slash({ name: "invite", description: "Приглашение на сервер поддержки" })
  handleInvite(interaction: ChatInputCommandInteraction) {
    return this.coreService.handleInviteCommand(interaction);
  }

  @Slash({ name: "help", description: "Документация по командам" })
  handleHelp(
    @SlashOption({
      name: "topic",
      description: "Тема",
      required: true,
      type: ApplicationCommandOptionType.String,
      autocomplete: (interaction) => {
        const focused = interaction.options.getFocused();
        const prepared = Documentation.filter((docs) =>
          focused === "" ? true : docs.name.includes(focused),
        )
          .map((docs, idx) => ({
            name: docs.name,
            value: `${idx}`,
          }))
          .slice(0, 25);
        return interaction.respond(prepared);
      },
    })
    topic: string,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.coreService.handleHelpCommand(interaction, topic);
  }
}
