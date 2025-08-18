import {
  blockQuote,
  channelMention,
  codeBlock,
  type EmbedField,
  roleMention,
  type Snowflake,
  StringSelectMenuOptionBuilder,
  time,
  TimestampStyles,
} from "discord.js";
import { DateTime } from "luxon";

import {
  DefaultTimezone,
  type getCommandByRemindType,
  MonitoringCommand,
} from "#/controllers/reminder/reminder.const.js";
import { TextFormattingUtility } from "#/libs/embed/text.utility.js";
import type { RemindDocument } from "#/models/reminder.model.js";
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
              settings?.pingChannelId
                ? channelMention(settings?.pingChannelId)
                : null,
            ),
            inline: true,
          },
          {
            name: blockQuote("Канал для логов"),
            value: TextFormattingUtility.snowflakeMention(
              settings?.logChannelId
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
        buttons: {
          backward: {
            label: "Назад",
          },
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
        buttons: {
          backward: {
            label: "Назад",
          },
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
  remind: {
    statusAll: {
      command: {
        name: "remaining",
        description: "Время до команд",
        args: {
          type: {
            name: "type",
            description: "Какой именно мониторинг",
          },
        },
      },
      embed: {
        title: "Статус мониторингов",
        fields: (
          monitorings: Record<
            ReturnType<typeof getCommandByRemindType>,
            RemindDocument
          >,
        ): EmbedField[] => {
          function canUse(monitoring?: RemindDocument) {
            if (!monitoring) {
              return codeBlock("Нет активных напоминаний");
            }

            const now = DateTime.now()
              .setZone(DefaultTimezone)
              .toJSDate()
              .getTime();
            const timestamp = DateTime.fromJSDate(monitoring.timestamp)
              .setZone(DefaultTimezone)
              .toJSDate()
              .getTime();

            return timestamp > now
              ? time(
                  Math.floor(timestamp / 1_000),
                  TimestampStyles.RelativeTime,
                )
              : codeBlock("Пора использовать");
          }
          return [
            {
              name: blockQuote(MonitoringCommand.DiscordMonitoring),
              value: canUse(monitorings.like),
              inline: true,
            },
            {
              name: blockQuote(MonitoringCommand.SdcMonitoring),
              value: canUse(monitorings.up),
              inline: true,
            },
            {
              name: blockQuote(MonitoringCommand.ServerMonitoring),
              value: canUse(monitorings.bump),
              inline: true,
            },
          ];
        },
      },
    },
    warning: {
      content: (roles: Snowflake[], command: string) =>
        `${roles.map((r) => roleMention(r))}, у системы сбился таймер для ${command}. Пропишите пожалуйста команду для запуска`,
    },
    ping: {
      content: (roles: Snowflake[], command: string) =>
        `${roles.map((r) => roleMention(r))}, пора использовать команду ${command}!`,
      embed: {
        title: "Продвижение сервера",
        description: "Самое время для прописания команды мониторинга",
      },
    },
  },
} as const;
