import type { EmbedField } from "discord.js";
import {
  blockQuote,
  inlineCode,
  StringSelectMenuOptionBuilder,
} from "discord.js";

import { UppyLinks } from "#/const/links.js";
import type {
  UppySettings,
  UppySettingsDocument,
} from "#/models/settings.model.js";
import {
  createChannelField,
  createPropertyField,
  createRoleField,
  getToggledValue,
} from "#/shared/messages/__utils.js";

export const UppySettingsMessage = {
  panel: {
    title: "Настройки бота",
    description: [
      "Добро пожаловать в панель настроек",
      "Более подробно прочитать можно здесь:",
      UppyLinks.DocsUrl,
    ].join("\n"),
    components: {
      managers: {
        roles: "Управление ролями",
        channels: "Управление каналами",
        award: "Управление поинтами",
        force: "Управление преждевременным пингом",
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
        fields: (settings: UppySettings): EmbedField[] => [
          createChannelField(
            "Канал для пингов",
            settings?.pingChannelId ?? null
          ),
          createChannelField(
            "Канал для логов",
            settings?.actionLogChannelId ?? null
          ),
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
            .setValue("actionLogChannelId"),
        ],
      },
    },
    force: {
      embed: {
        title: "Управление преждевременными пингами",
        fields: (settings: UppySettingsDocument): EmbedField[] => {
          return [
            createPropertyField(
              "Состояние",
              getToggledValue(settings.useForceOnly)
            ),
            createPropertyField("Количество секунд", settings.force),
          ];
        },
      },
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
        fields: (settings: UppySettings): EmbedField[] => [
          createRoleField("Роли сотрудника", settings?.bumpRoleIds ?? null),
          createRoleField(
            "Роль для бамп бана",
            settings?.bumpBanRoleId ?? null
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
            .setLabel("Роли менеджеров")
            .setValue("managerRoles"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Роль бамп бана")
            .setValue("bumpBanRoleId"),
        ],
      },
    },
  },
};
