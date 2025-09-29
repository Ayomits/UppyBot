import type { EmbedField } from "discord.js";
import {
  blockQuote,
  inlineCode,
  StringSelectMenuOptionBuilder,
} from "discord.js";

import type { Settings } from "#/models/settings.model.js";
import {
  createChannelField,
  createPropertyField,
  createRoleField,
  getToggledValue,
} from "#/shared/messages/__utils.js";

export const UppySettingsMessage = {
  panel: {
    title: "Настройки бота",
    fields: (settings: Settings): EmbedField[] => [
      createChannelField("Канал для пингов", settings?.pingChannelId ?? null),
      createRoleField("Роли хелпера", settings?.bumpRoleIds ?? null),
      createRoleField("Роль бамп бана", settings?.bumpBanRoleId ?? null),
      createPropertyField(
        "Преждевременный пинг (секунды)",
        settings?.force ?? 0,
      ),
      createPropertyField(
        "Использовать только преждевременный пинг",
        getToggledValue(settings?.useForceOnly),
      ),
    ],
    components: {
      managers: {
        roles: "Управление ролями",
        channels: "Управление каналами",
        award: "Управление поинтами",
      },
      actions: {
        setForceTime: "Преждевременный пинг",
        toggleUseForce: "Только преждевременные пинги",
      },
      updaters: {
        panel: "Обновить панель",
      },
    },
  },

  managers: {
    channels: {
      embed: {
        title: "Управление каналами",
        fields: (settings: Settings): EmbedField[] => [
          createChannelField(
            "Канал для пингов",
            settings?.pingChannelId ?? null,
          ),
          createChannelField("Канал для логов", settings?.logChannelId ?? null),
        ],
      },
      buttons: { backward: { label: "Назад" } },
      select: {
        actions: { channel: "Выберите канал" },
        placeholder: "Выберите опцию настройки",
        options: [
          new StringSelectMenuOptionBuilder()
            .setLabel("Канал для пингов")
            .setValue("pingChannelId"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Канал для логгирования")
            .setValue("logChannelId"),
        ],
      },
    },
    force: {
      buttons: {
        actions: {
          useForceOnly: {
            content: (status: boolean) =>
              `Вы успешно переключили состояние на ${inlineCode(getToggledValue(status))}`,
          },
        },
      },
      modal: {
        actions: {
          setForceTime: {
            content: "Вы успешно установить время преждевременного пинга",
          },
        },
      },
    },
    roles: {
      embed: {
        title: blockQuote("Управление ролями"),
        fields: (settings: Settings): EmbedField[] => [
          createRoleField("Роли сотрудника", settings?.bumpRoleIds ?? null),
          createRoleField(
            "Роль для бамп бана",
            settings?.bumpBanRoleId ?? null,
          ),
          createRoleField("Роли менеджеров", settings?.managerRoles ?? null),
        ],
      },
      buttons: { backward: { label: "Назад" } },
      select: {
        actions: { role: "Выберите роль" },
        placeholder: "Выберите опцию настройки",
        options: [
          new StringSelectMenuOptionBuilder()
            .setLabel("Роли сотрудников")
            .setValue("bumpRoleIds"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Роли управляющих")
            .setValue("managerRoles"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Роль бамп бана")
            .setValue("bumpBanRoleId"),
        ],
      },
    },
  },
};
