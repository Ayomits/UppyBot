import {
  blockQuote,
  channelMention,
  type EmbedField,
  roleMention,
  StringSelectMenuOptionBuilder,
} from "discord.js";

import { TextFormattingUtility } from "#/libs/embed/text.utility.js";
import type { Settings } from "#/models/settings.model.js";

export const HelperBotMessages = {
  settings: {
    command: {
      name: "settings",
      description: "Команда позволяет настроить бота",
    },
    panel: {
      title: "Настройки бота",
      fields: (settings: Settings): EmbedField[] => {
        return [
          {
            name: blockQuote("Канал для пингов"),
            value: TextFormattingUtility.snowflakeMention(
              settings.pingChannelId
                ? channelMention(settings?.pingChannelId)
                : null,
            ),
            inline: true,
          },
          {
            name: blockQuote("Канал для логов"),
            value: TextFormattingUtility.snowflakeMention(
              settings.logChannelId
                ? channelMention(settings?.logChannelId)
                : null,
            ),
            inline: true,
          },
          {
            name: blockQuote("Роли хелпера"),
            value: TextFormattingUtility.snowflakeMention(
              settings?.bumpRoleIds.map((role) => roleMention(role)),
            ),
            inline: false,
          },
          {
            name: blockQuote("Роль бамп бана"),
            value: TextFormattingUtility.snowflakeMention(
              settings?.bumpBanRoleId
                ? roleMention(settings?.bumpBanRoleId)
                : null,
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
    managers: {
      channels: {
        embed: {
          title: "Управление каналами",
          fields: (settings: Settings): EmbedField[] => [
            {
              name: blockQuote("Канал для пингов"),
              value: TextFormattingUtility.snowflakeMention(
                settings.pingChannelId
                  ? channelMention(settings?.pingChannelId)
                  : null,
              ),
              inline: true,
            },
            {
              name: blockQuote("Канал для логов"),
              value: TextFormattingUtility.snowflakeMention(
                settings.logChannelId
                  ? channelMention(settings?.logChannelId)
                  : null,
              ),
              inline: true,
            },
          ],
        },
        select: {
          actions: {
            channel: "Выберите канал",
          },
          placeholder: "Выберите опцию настройки",
          options: [
            new StringSelectMenuOptionBuilder()
              .setLabel("Канал для пингов")
              .setValue("pingChannelId"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Канал для логов")
              .setValue("logChannelId"),
          ],
        },
      },
      roles: {
        embed: {
          title: blockQuote("Управление ролями"),
          fields: (settings: Settings): EmbedField[] => [
            {
              name: "Возможные роли сотрудника",
              value: TextFormattingUtility.snowflakeMention(
                settings?.bumpRoleIds.map((r) => roleMention(r)),
              ),
              inline: true,
            },
            {
              name: blockQuote("Роль для бамп бана"),
              value: TextFormattingUtility.snowflakeMention(
                settings?.bumpBanRoleId
                  ? roleMention(settings?.bumpBanRoleId)
                  : null,
              ),
              inline: true,
            },
          ],
        },
        select: {
          actions: {
            role: "Выберите роль",
          },
          placeholder: "Выберите опцию настройки",
          options: [
            new StringSelectMenuOptionBuilder()
              .setLabel("Роли сотрудников")
              .setValue("bumpRoleIds"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Роль бамп бана")
              .setValue("bumpBanRoleId"),
          ],
        },
      },
    },
  },
} as const;
