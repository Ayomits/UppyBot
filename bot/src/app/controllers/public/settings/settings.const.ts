import {
  ActionRowBuilder,
  bold,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { UppyGuildType } from "#/db/models/guild.model.js";
import type { SettingsDocument } from "#/db/models/settings.model.js";

// Базовые ID для взаимодействий
export const SettingsIds = {
  select: "@settings/base-select",
  change: "@settings/base-change",
  toggle: "@settings/base-toggle",
  navigation: "@settings/base-nav",
  refresh: "@settings/refresh",
};

// Частные ID для модалок
export const forceModalId = "@settings/force";
export const basePointsId = "@settings/points";

// Тип конфигурации настройки
export type SettingsConfig = {
  access?: UppyGuildType;
  label: string;
  field: string;
  type: "channel" | "role" | "value" | "toggle";
  display?: (settings: SettingsDocument) => string;
  select?: {
    choice: "multi" | "single";
    placeholder: string;
  };
  toggle?: boolean;
  modal?: {
    title: string;
    customId: string;
    fields: (
      settings: SettingsDocument,
    ) => ActionRowBuilder<TextInputBuilder>[];
  };
};

// Навигация по разделам
export const SettingsNavigation: {
  label: string;
  value: keyof typeof SettingsPipelines;
  description?: string;
}[] = [
  { label: "Роли", value: "roles" },
  { label: "Каналы", value: "channels" },
  { label: "Напоминания", value: "reminds" },
  {
    label: "Преждевременные напоминания",
    value: "force",
    description: "Только для премиум серверов",
  },
  { label: "Поинты", value: "points" },
  { label: "Бамп баны", value: "bumpBan" },
];

// Базовые конфигурации для часто используемых паттернов
const baseConfigs = {
  // Роли с мультивыбором
  multiRole: (
    field: string,
    label: string,
    access: UppyGuildType = UppyGuildType.Common,
  ): SettingsConfig => ({
    label,
    field,
    type: "role",
    select: { choice: "multi", placeholder: "Выберите роли" },
    access,
  }),

  // Канал с одиночным выбором
  singleChannel: (
    field: string,
    label: string,
    access: UppyGuildType = UppyGuildType.Common,
  ): SettingsConfig => ({
    label,
    field,
    type: "channel",
    select: { choice: "single", placeholder: "Выберите канал" },
    access,
  }),

  // Тоггл
  toggle: (
    field: string,
    label: string,
    access: UppyGuildType = UppyGuildType.Common,
  ): SettingsConfig => ({
    label,
    field,
    type: "toggle",
    toggle: true,
    access,
  }),
};

// Создание числового инпута
const createNumberInput = (id: string, label: string, value?: number) =>
  new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("1")
      .setValue(value?.toString() || "1"),
  );

// Конфигурации разделов
export const SettingsRolesPipeline = {
  pingRoles: baseConfigs.multiRole("roles.pingRoles", "Роли для упоминаний"),
  staffRoles: baseConfigs.multiRole("roles.staffRoles", "Роли для сотрудников"),
  managerRoles: baseConfigs.multiRole(
    "roles.managerRoles",
    "Роли с расширенными правами",
  ),
} as const;

export const SettingsChannelsPipeline = {
  actionLogChannelId: baseConfigs.singleChannel(
    "channels.actionLogChannelId",
    "Канал для логгирования действий",
  ),
  pingChannelId: baseConfigs.singleChannel(
    "channels.pingChannelId",
    "Канал для напоминаний",
  ),
} as const;

export const SettingsRemindsPipeline = {
  enabled: baseConfigs.toggle("remind.enabled", "Состояние"),
} as const;

export const SettingsForceRemindsPipeline = {
  enabled: baseConfigs.toggle("force.enabled", "Состояние"),
  useForceOnly: baseConfigs.toggle(
    "force.useForceOnly",
    "Использовать только преждевременные пинги",
  ),
  seconds: {
    label: "Секунд до преждевременного пинга",
    field: "force.seconds",
    type: "value" as const,
    modal: {
      customId: forceModalId,
      title: "Преждевременный пинг",
      fields: (settings: SettingsDocument) => [
        createNumberInput("value", "Секунды", settings.force?.seconds ?? 0),
      ],
    },
  },
};

// Функция для создания конфигураций мониторинга поинтов
const createPointsMonitoringConfig = (
  service: string,
  label: string,
): SettingsConfig => ({
  label,
  field: `points.${service}`,
  display: (settings: SettingsDocument) =>
    [
      `${bold("Обычно:")} ${settings.points?.[service]?.default || 0}`,
      `${bold("Бонус:")} ${settings.points?.[service]?.bonus || 0}`,
    ].join("\n"),
  type: "value" as const,
  modal: {
    title: "Настройки поинтов",
    customId: `${basePointsId}_points.${service}`,
    fields: (settings: SettingsDocument) => [
      createNumberInput(
        "default",
        "Обычно",
        settings.points?.[service]?.default,
      ),
      createNumberInput("bonus", "Бонус", settings.points?.[service]?.bonus),
    ],
  },
});

export const SettingsPointsPipeline = {
  enabled: baseConfigs.toggle("points.enabled", "Состояние"),
  dsMonitoring: createPointsMonitoringConfig("dsMonitoring", "Ds monitoring"),
  disboard: createPointsMonitoringConfig("disboard", "Disboard monitoring"),
  sdc: createPointsMonitoringConfig("sdc", "Sdc monitoring"),
  server: createPointsMonitoringConfig("server", "Server Monitoring"),
} as const;

export const SettingsKdPipeline = {
  enabled: {
    access: UppyGuildType.Premium,
    ...baseConfigs.toggle("kd.enabled", "Состояние"),
  },
  dsMonitoring: {
    label: "Ds monitoring",
    field: "kd.dsMonitoring",
    type: "value" as const,
  },
  disboard: {
    label: "Disboard monitoring",
    field: "kd.disboard",
    type: "value" as const,
  },
  sdc: { label: "Sdc monitoring", field: "kd.sdc", type: "value" as const },
  server: {
    label: "Server Monitoring",
    field: "kd.server",
    type: "value" as const,
  },
} as const;

export const SettingsBumpBanPipeline = {
  enabled: baseConfigs.toggle("bumpBan.enabled", "Состояние"),
  roleId: {
    label: "Роль для бамп бана",
    field: "bumpBan.roleId",
    type: "role" as const,
    select: { choice: "single" as const, placeholder: "Выберите роль" },
  },
} as const;

// Все конвейеры настроек
export const SettingsPipelines = {
  roles: {
    access: UppyGuildType.Common,
    pipeline: SettingsRolesPipeline,
  },
  channels: {
    access: UppyGuildType.Common,
    pipeline: SettingsChannelsPipeline,
  },
  points: {
    access: UppyGuildType.Common,
    pipeline: SettingsPointsPipeline,
  },
  reminds: {
    access: UppyGuildType.Common,
    pipeline: SettingsRemindsPipeline,
  },
  force: {
    access: UppyGuildType.Premium,
    pipeline: SettingsForceRemindsPipeline,
  },
  kd: {
    access: UppyGuildType.Premium,
    pipeline: SettingsKdPipeline,
  },
  bumpBan: {
    access: UppyGuildType.Common,
    pipeline: SettingsBumpBanPipeline,
  },
} as const;

export type SettingsPipelineConfig = Record<string, SettingsConfig>;

export function getSectionName(name: keyof typeof SettingsPipelines) {
  const names = {
    roles: "Настройки ролей",
    channels: "Настройки каналов",
    points: "Настройки системы поинтов",
    reminds: "Настройки системы напоминаний",
    force: "Настройки системы преждевременных напоминаний",
    kd: "Настройка кд системы",
    bumpBan: "Настройка бамп бана",
  };

  return names[name] || "";
}
