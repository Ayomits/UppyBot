import type { ActionRowBuilder, TextInputBuilder } from "discord.js";

export const SettingsIds = {
  select: "@settings/base-select",
  change: "@settings/base-change",
  toggle: "@settings/base-toggle",
  navigation: "@settings/base-nav",
};

export type SettingsConfig = {
  label: string;
  field: string;
  type: "channel" | "role" | "value" | "toggle";
  select?: {
    choice: "multi" | "single";
    placeholder: string;
  };
  toggle?: boolean;
  modal?: {
    title: string;
    customId: string;
    fields: ActionRowBuilder<TextInputBuilder>[];
  };
};

export const SettingsNavigation = [
  {
    label: "Роли",
    value: "roles",
  },
  {
    label: "Каналы",
    value: "channels",
  },
  {
    label: "Напоминания",
    value: "reminds",
  },
  {
    label: "Поинты",
    value: "points",
  },
  {
    label: "Кд система",
    value: "kd",
  },
];

export type SettingsPipelineConfig = Record<string, SettingsConfig>;

export const SettingsRolesPipeline: SettingsPipelineConfig = {
  bumpRoleIds: {
    label: "Роли для пингов",
    field: "roles.bumpRoleIds",
    type: "role",
    select: {
      choice: "multi",
      placeholder: "Выберите роль",
    },
  },
};

export const SettingsChannelsPipeline: SettingsPipelineConfig = {
  bumpRoleIds: {
    label: "Роли для напоминания",
    field: "channels.pingChannelId",
    type: "channel",
    select: {
      choice: "multi",
      placeholder: "Выберите канал",
    },
  },
};

export const SettingsRemindsPipeline: SettingsPipelineConfig = {
  bumpRoleIds: {
    label: "Роли для пингов",
    field: "roles.bumpRoleIds",
    type: "role",
    select: {
      choice: "multi",
      placeholder: "Выберите роль",
    },
  },
};

export const SettingsPointsPipeline: SettingsPipelineConfig = {
  bumpRoleIds: {
    label: "Роли для пингов",
    field: "roles.bumpRoleIds",
    type: "role",
    select: {
      choice: "multi",
      placeholder: "Выберите роль",
    },
  },
};

export const SettingsKdPipeline: SettingsPipelineConfig = {
  enabled: {
    label: "Состояние",
    field: "kd.enabled",
    type: "toggle",
    toggle: true,
  },
};

export const SettingsPipelines = {
  roles: SettingsRolesPipeline,
  channels: SettingsChannelsPipeline,
  points: SettingsPointsPipeline,
  reminds: SettingsRemindsPipeline,
  kd: SettingsKdPipeline,
} as const;
