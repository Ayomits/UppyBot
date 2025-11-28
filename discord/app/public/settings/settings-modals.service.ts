import type { DiscordAPIError, ModalSubmitInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import { inject, injectable } from "tsyringe";

import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { CustomIdParser } from "#/shared/libs/parser/custom-id.parser.js";

@injectable()
export class SettingsModalService {
  constructor(
    @inject(SettingsRepository) private settingsRepository: SettingsRepository
  ) {}

  public async handlePointsModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const [defaultVal, bonusVal] = [
      Math.max(0, Number(interaction.fields.getTextInputValue("default"))),
      Math.max(0, Number(interaction.fields.getTextInputValue("bonus"))),
    ];

    const [fieldPath] = CustomIdParser.parseArguments(interaction.customId, {});

    await this.settingsRepository.update(interaction.guildId!, {
      [`${fieldPath}.default`]: defaultVal,
      [`${fieldPath}.bonus`]: bonusVal,
    });

    await interaction.editReply({ content: "Успешно обновлены значения" });
  }

  public async handleForceModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const [forceValue] = [
      Math.max(0, Number(interaction.fields.getTextInputValue("value"))),
    ];

    await this.settingsRepository.update(interaction.guildId!, {
      "force.seconds": forceValue,
    });

    await interaction.editReply({ content: "Успешно обновлено значение" });
  }

  public async handleTemplateModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const [type_] = CustomIdParser.parseArguments(interaction.customId, {});

    const value = interaction.fields.getTextInputValue("template");

    await this.settingsRepository.update(interaction.guildId!, {
      [`templates.${type_}`]: value,
    });

    await interaction.editReply({ content: "Успешно обновлено значение" });
  }

  public async handleBrandingModal(interaction: ModalSubmitInteraction) {
    const url = interaction.fields.getTextInputValue("url");
    const [type] = CustomIdParser.parseArguments(interaction.customId, {});
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await interaction.guild?.members.editMe({
        [type]: url ?? null,
      });

      interaction.editReply({
        content: "Настройки применены",
      });

      await this.settingsRepository.update(interaction.guildId!, {
        [`theming.${type}`]: url,
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
