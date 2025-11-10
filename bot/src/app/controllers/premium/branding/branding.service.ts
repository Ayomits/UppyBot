import type {
  ButtonInteraction,
  DiscordAPIError,
  ModalSubmitInteraction,
} from "discord.js";
import {
  ActionRowBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  heading,
  hyperlink,
  MessageFlags,
  ModalBuilder,
  quote,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { injectable } from "tsyringe";

import { CustomIdParser } from "#/libs/parser/custom-id.parser.js";
import { createSafeCollector } from "#/libs/djs/collector.js";

import { BrandingChangeUrlModal } from "./branding.const.js";

@injectable()
export class BrandingService {
  async handleBrandingCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const client = await interaction.guild!.members.fetch(
      interaction.client.user.id,
    );

    const baseId = "@branding/change";

    const container = new ContainerBuilder()
      .addTextDisplayComponents((builder) =>
        builder.setContent([heading("Настройки профиля")].join("\n")),
      )
      .addSectionComponents(
        (builder) =>
          builder
            .addTextDisplayComponents((builder) =>
              builder.setContent(
                [
                  quote("Аватарка бота"),
                  client.displayAvatarURL()
                    ? hyperlink("Тык", client.displayAvatarURL())
                    : "Нет",
                ].join("\n"),
              ),
            )
            .setButtonAccessory((builder) =>
              builder
                .setLabel("Изменить")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`${baseId}_avatar`),
            ),
        (builder) =>
          builder
            .addTextDisplayComponents((builder) =>
              builder.setContent(
                [
                  quote("Баннер бота"),
                  client.displayBannerURL()
                    ? hyperlink("Тык", client.displayBannerURL()!)
                    : "Нет",
                ].join("\n"),
              ),
            )
            .setButtonAccessory((builder) =>
              builder
                .setLabel("Изменить")
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`${baseId}_banner`),
            ),
      );

    const reply = await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = createSafeCollector(reply);

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;

      const [base] = CustomIdParser.parseArguments(customId, {
        returnFull: true,
      });

      const handlers = {
        [baseId]: this.handleChange.bind(this),
      };

      return handlers?.[base](interaction);
    });
  }

  private handleChange(interaction: ButtonInteraction) {
    const [type] = CustomIdParser.parseArguments(interaction.customId, {});
    const modal = new ModalBuilder()
      .setTitle("Профиль")
      .setCustomId(`${BrandingChangeUrlModal}_${type}`)
      .setComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("url")
            .setLabel("Ссылка")
            .setPlaceholder("Вставьте ссылку")
            .setStyle(TextInputStyle.Short)
            .setRequired(false),
        ),
      );

    interaction.showModal(modal);
  }

  async handleChangeUrl(interaction: ModalSubmitInteraction) {
    const url = interaction.fields.getTextInputValue("url");
    const [type] = CustomIdParser.parseArguments(interaction.customId, {});
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await interaction.guild?.members.editMe({
        [type]: url ?? null,
      });

      return interaction.editReply({
        content: "Настройки применены",
      });
    } catch (err) {
      if ((err as DiscordAPIError).code === 50035) {
        return interaction.editReply({
          content: "Ваш сервер попал под лимиты, невозможно изменить профиль",
        });
      }

      return interaction.editReply({
        content: "Что-то пошло не так во время смены профиля...",
      });
    }
  }
}
