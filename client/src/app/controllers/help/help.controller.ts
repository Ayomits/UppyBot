import type { ChatInputCommandInteraction } from "discord.js";
import { ApplicationCommandOptionType } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { inject, singleton } from "tsyringe";

import { Documentation } from "#/const/documentation.js";

import { UppyHelpService } from "./help.service.js";

@Discord()
@singleton()
export class UppyHelpController {
  constructor(@inject(UppyHelpService) private helpService: UppyHelpService) {}

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
    return this.helpService.handleHelpCommand(interaction, topic);
  }
}
