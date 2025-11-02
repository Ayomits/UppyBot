import type { ModalSubmitInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import { injectable } from "tsyringe";

import { CustomIdParser } from "#/libs/parser/custom-id.parser.js";
import { SettingsModel } from "#/models/settings.model.js";

@injectable()
export class SettingsModalService {
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
    await SettingsModel.findOneAndUpdate(
      { guildId: interaction.guildId! },
      {
        [`${fieldPath}.default`]: defaultVal,
        [`${fieldPath}.bonus`]: bonusVal,
      },
      { upsert: true },
    );

    await interaction.editReply({ content: "Успешно обновлены значения" });
  }

  // Модальное окно для принудительных напоминаний
  public async handleForceModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const [forceValue] = [
      Math.max(0, Number(interaction.fields.getTextInputValue("value"))),
    ];

    await SettingsModel.findOneAndUpdate(
      { guildId: interaction.guildId! },
      { "force.seconds": forceValue },
      { upsert: true },
    );

    await interaction.editReply({ content: "Успешно обновлено значение" });
  }
}
