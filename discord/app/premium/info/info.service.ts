import type { ChatInputCommandInteraction } from "discord.js";
import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  heading,
  inlineCode,
  MessageFlags,
  quote,
  time,
  TimestampStyles,
} from "discord.js";
import { Discord } from "discordx";
import { singleton } from "tsyringe";

import { ExternalLinks } from "#/discord/const/links.js";
import { PremiumModel } from "#/shared/db/models/uppy-discord/premium.model.js";

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
            quote("Подписка действует до:"),
            time(
              Math.floor(premium.expiresAt.getTime() / 1_000),
              TimestampStyles.LongDateTime,
            ),
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
