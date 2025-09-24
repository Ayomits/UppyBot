import {
  blockQuote,
  bold,
  channelMention,
  codeBlock,
  type EmbedField,
  inlineCode,
  roleMention,
  type Snowflake,
  StringSelectMenuOptionBuilder,
  time,
  TimestampStyles,
} from "discord.js";
import { DateTime } from "luxon";

import { TextFormattingUtility } from "#/libs/embed/text.utility.js";
import type { BumpBan } from "#/models/bump-ban.model.js";
import type {
  RemindDocument,
  StaffInfoAgregation,
} from "#/models/remind.model.js";
import type { Settings } from "#/models/settings.model.js";
import {
  BumpBanLimit,
  DefaultTimezone,
  type getCommandByRemindType,
  MonitoringCommand,
} from "#/modules/reminder/reminder.const.js";

const createChannelField = (name: string, channelId: Snowflake | null) => ({
  name: blockQuote(name),
  value: TextFormattingUtility.snowflakeMention(
    channelId ? channelMention(channelId) : null
  ),
  inline: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createPropertyField = (name: string, property: any) => ({
  name: blockQuote(name),
  value: typeof property === "string" ? property : String(property),
  inline: true,
});

const createRoleField = (
  name: string,
  roleIds: Snowflake | Snowflake[] | null
) => ({
  name: blockQuote(name),
  value: TextFormattingUtility.snowflakeMention(
    Array.isArray(roleIds)
      ? roleIds.map(roleMention)
      : roleIds
        ? roleMention(roleIds)
        : null
  ),
  inline: !Array.isArray(roleIds),
});

const canUseMonitoring = (monitoring?: RemindDocument) => {
  if (!monitoring) return codeBlock("Нет активных напоминаний");

  const timestamp = DateTime.fromJSDate(monitoring.timestamp)
    .setZone(DefaultTimezone)
    .toMillis();

  const curr = DateTime.now().setZone(DefaultTimezone).toMillis();

  return curr > timestamp
    ? codeBlock("Можно использовать")
    : time(Math.floor(timestamp / 1_000), TimestampStyles.RelativeTime);
};

const getToggledValue = (value: boolean) => {
  return value ? "вкл" : "выкл";
};

export const RemindSystemMessage = {
  remind: {
    warning: {
      content: (roles: Snowflake[], command: string) =>
        `${roles.map(roleMention).join(" ")}, у системы сбился таймер для ${command}. Пропишите пожалуйста команду для запуска`,
    },

    force: {
      content: (roles: Snowflake[], command: string, force: number) =>
        `${roles.map(roleMention).join(" ")}, команда ${command} будет доступа ${time(Math.floor((Date.now() + force * 1_000) / 1_000), TimestampStyles.RelativeTime)}`,
    },

    ping: {
      content: (roles: Snowflake[], command: string) =>
        `${roles.map(roleMention).join(" ")}, пора использовать команду ${command}!`,
      embed: {
        title: "Продвижение сервера",
        description: "Самое время для прописания команды мониторинга",
      },
    },
  },

  monitoring: {
    embed: {
      title: "Продвижение сервера",
      description: (points: number, command: MonitoringCommand) =>
        [
          "Большое спасибо, что продвигаете наш сервер на мониторингах",
          `За это действие вы получили: ${bold(`${points} поинтов`)}`,
          `Выполненная команда: ${inlineCode(command)}`,
        ].join("\n"),
    },
  },
};

export const GuardMessage = {
  isHelper: {
    invalidSettings: "В настройках ботах нужно выставить роли для сотрудников!",
    notHelper: "Вы не имеете роли сотрудников",
  },
};

export const HelperSettingsMessage = {
  panel: {
    title: "Настройки бота",
    fields: (settings: Settings): EmbedField[] => [
      createChannelField("Канал для пингов", settings?.pingChannelId ?? null),
      createRoleField("Роли хелпера", settings?.bumpRoleIds ?? null),
      createRoleField("Роль бамп бана", settings?.bumpBanRoleId ?? null),
      createPropertyField(
        "Преждевременный пинг (секунды)",
        settings.force ?? 0
      ),
      createPropertyField(
        "Использовать только преждевременный пинг",
        getToggledValue(settings?.useForceOnly)
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
            settings.pingChannelId ?? null
          ),
          createChannelField(
            "Канал для логов",
            settings.logChannelId ?? null
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
          createRoleField(
            "Возможные роли сотрудника",
            settings?.bumpRoleIds ?? null
          ),
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

export const HelperInfoMessage = {
  embed: {
    title: "Информация о сотруднике",
    fields: (data: StaffInfoAgregation, bubmBan?: BumpBan): EmbedField[] => {
      return [
        createPropertyField(
          MonitoringCommand.DiscordMonitoring,
          codeBlock(data?.like ? data?.like?.toString() : "0")
        ),
        createPropertyField(
          MonitoringCommand.SdcMonitoring,
          codeBlock(data?.up ? data?.up?.toString() : "0")
        ),
        createPropertyField(
          MonitoringCommand.ServerMonitoring,
          codeBlock(data?.bump ? data?.bump?.toString() : "0")
        ),
        createPropertyField(
          "Бамп бан",
          !bubmBan
            ? codeBlock("Не активен")
            : codeBlock(`${BumpBanLimit - bubmBan?.removeIn} до снятия`)
        ),
        createPropertyField(
          "Поинты за период",
          codeBlock(data?.points ? data?.points?.toString() : "0")
        ),
      ];
    },
  },
};

export const HelperRemainingMessage = {
  buttons: {
    update: "Обновить информацию",
  },
  embed: {
    title: "Статус мониторингов",
    fields: (
      monitorings: Record<
        ReturnType<typeof getCommandByRemindType>,
        RemindDocument
      >
    ): EmbedField[] => [
      {
        name: blockQuote(MonitoringCommand.DiscordMonitoring),
        value: canUseMonitoring(monitorings.like),
        inline: true,
      },
      {
        name: blockQuote(MonitoringCommand.SdcMonitoring),
        value: canUseMonitoring(monitorings.up),
        inline: true,
      },
      {
        name: blockQuote(MonitoringCommand.ServerMonitoring),
        value: canUseMonitoring(monitorings.bump),
        inline: true,
      },
    ],
  },
};
