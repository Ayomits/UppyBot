import type { ChatInputCommandInteraction } from "discord.js";
import {
  ButtonBuilder,
  ButtonStyle,
  codeBlock,
  ContainerBuilder,
  heading,
  inlineCode,
  MessageFlags,
  quote,
} from "discord.js";
import { Discord } from "discordx";
import { singleton } from "tsyringe";

import { ExternalLinks } from "#/const/links.js";
import { calculateDiffTime } from "#/libs/time/diff.js";
import { PremiumModel } from "#/db/models/premium.model.js";

@singleton()
@Discord()
export class PremiumInfoService {
  async handleInfo(interaction: ChatInputCommandInteraction) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      (builder) => builder.setContent(heading("Статус премиум подписки")),
    );
    const premium = await PremiumModel.findOne({
      guildId: interaction.guildId,
    });

    if (!premium) {
      container.addTextDisplayComponents((builder) =>
        builder.setContent(
          [
            "К сожалению, у вас нет премиум подписки",
            `Если вы хотите её купить - читайте информацию в команде: ${inlineCode("/premium subscribe")}`,
          ].join("\n"),
        ),
      );
    } else {
      container.addTextDisplayComponents((builder) =>
        builder.setContent(
          [
            quote("Подписка действует:"),
            codeBlock(calculateDiffTime(premium.expiresAt, new Date())),
          ].join("\n"),
        ),
      );
    }

    return interaction.reply({
      components: [
        container.addActionRowComponents((row) =>
          row.addComponents(
            new ButtonBuilder()
              .setLabel(premium ? "Продлить" : "Купить")
              .setStyle(ButtonStyle.Link)
              .setURL(ExternalLinks.SupportServer),
          ),
        ),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
