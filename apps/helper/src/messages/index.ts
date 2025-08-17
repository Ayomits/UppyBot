import type { HelperBotSettings } from "@fear/prisma";
import { type EmbedField, roleMention } from "discord.js";

import { TextFormattingUtility } from "#/libs/embed/text.utility.js";

export const HelperBotMessages = {
  settings: {
    command: {
      name: "settings",
      description: "Команда позволяет настроить бота",
    },
    panel: {
      title: "Настройки бота",
      fields: (settings: HelperBotSettings): EmbedField[] => {
        return [
          {
            name: "Канал для пингов",
            value: TextFormattingUtility.snowflakeMention(
              settings?.pingChannelId
            ),
            inline: true,
          },
          {
            name: "Роли хелпера",
            value: TextFormattingUtility.snowflakeMention(
              settings?.helperRoleIds.map((role) => roleMention(role))
            ),
            inline: true,
          },
        ];
      },
      buttons: {
        managers: {
          roles: "Управление ролями",
          channels: "Управление каналами",
        },
        updaters: {
          panel: "Обновить панель",
        },
      },
    },
  },
} as const;
