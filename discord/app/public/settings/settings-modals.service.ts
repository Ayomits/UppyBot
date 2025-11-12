import type { ModalSubmitInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import { inject, injectable } from "tsyringe";

import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { CustomIdParser } from "#/shared/libs/parser/custom-id.parser.js";

@injectable()
export class SettingsModalService {
  constructor(
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
  ) {}

  // Модальное окно для настроек поинтов
  public async handlePointsModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Получаем значения из полей модалки
    const [defaultVal, bonusVal] = [
      Math.max(0, Number(interaction.fields.getTextInputValue("default"))),
      Math.max(0, Number(interaction.fields.getTextInputValue("bonus"))),
    ];

    const [fieldPath] = CustomIdParser.parseArguments(interaction.customId, {});

    // Обновляем настройки в БД
    await this.settingsRepository.update(interaction.guildId!, {
      [`${fieldPath}.default`]: defaultVal,
      [`${fieldPath}.bonus`]: bonusVal,
    });

    await interaction.editReply({ content: "Успешно обновлены значения" });
  }

  // Модальное окно для принудительных напоминаний
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
}
