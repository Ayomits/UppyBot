import { GuildType } from "#/shared/db/models/uppy-discord/guild.model.js";

import {
  SettingsBumpBanPipeline,
  SettingsForceRemindsPipeline,
  SettingsLoggingPipeline,
  SettingsPointsPipeline,
  SettingsRemindsPipeline,
  SettingsTelegramPipeline,
  SettingsTemplatePipeline,
  SettingsThemingPipeline,
} from "./settings.pipes.js";

export const SettingsNavigation: {
  label: string;
  value: keyof typeof SettingsPipelines;
  description?: string;
}[] = [
  {
    label: "Напоминания",
    value: "reminds",
    description: "Настройка напоминаний",
  },
  {
    label: "Преждевременные напоминания",
    value: "force",
    description: "Настройка преждевременных уведомлений",
  },
  {
    label: "Бамп баны",
    value: "bumpBan",
    description: "Кд5 система",
  },
  {
    label: "Логгирование",
    value: "logging",
    description: "Логи для каждого события",
  },
  {
    label: "Поинты",
    value: "points",
    description: "Система баллов",
  },
  {
    label: "Брендирование",
    value: "theming",
    description: "Кастом аватар, баннер и тема",
  },
  {
    label: "Телеграмм уведомления",
    value: "telegram",
    description: "Включить/Выключить напоминания в телеграмме для сервера",
  },
  {
    label: "Шаблоны напоминаний",
    value: "templates",
    description: "Кастомные сообщения для напоминаний",
  },
];

export function getSectionName(name: keyof typeof SettingsPipelines) {
  const names: Record<keyof typeof SettingsPipelines, string> = {
    points: "Настройки системы поинтов",
    reminds: "Настройки системы напоминаний",
    force: "Настройки системы преждевременных напоминаний",
    // kd: "Настройка кд системы",
    bumpBan: "Настройка бамп бана",
    logging: "Настройка логгирования",
    theming: "Настройка брендирования",
    telegram: "Подключить телеграмм уведомления",
    templates: "Шаблоны напоминаний",
  };

  return names[name] || "";
}

export const SettingsPipelines = {
  points: {
    access: GuildType.Common,
    pipeline: SettingsPointsPipeline,
  },
  reminds: {
    access: GuildType.Common,
    pipeline: SettingsRemindsPipeline,
  },
  force: {
    access: GuildType.Common,
    pipeline: SettingsForceRemindsPipeline,
  },
  bumpBan: {
    access: GuildType.Common,
    pipeline: SettingsBumpBanPipeline,
  },
  theming: {
    access: GuildType.Premium,
    pipeline: SettingsThemingPipeline,
  },
  logging: {
    access: GuildType.Common,
    pipeline: SettingsLoggingPipeline,
  },
  telegram: {
    access: GuildType.Common,
    pipeline: SettingsTelegramPipeline,
  },
  templates: {
    pipeline: SettingsTemplatePipeline,
    access: GuildType.Premium,
  },
} as const;
