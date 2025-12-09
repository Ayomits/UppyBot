import { GuildType } from "#/shared/db/models/uppy-discord/guild.model.js";

import {
  SettingsBumpBanPipeline,
  SettingsDevLogPipeline,
  SettingsForceRemindsPipeline,
  SettingsLoggingPipeline,
  SettingsPointsPipeline,
  SettingsRemindsPipeline,
  SettingsTelegramPipeline,
  SettingsTemplatePipeline,
  SettingsThemingPipeline,
  SettingsWebhookPipeline,
} from "./settings.pipes.js";

export const SettingsNavigation: {
  label: string;
  value: keyof typeof SettingsPipelines;
  description?: string;
  public: boolean;
}[] = [
  {
    label: "Напоминания",
    value: "reminds",
    description: "Настройка напоминаний",
    public: true,
  },
  {
    label: "Преждевременные напоминания",
    value: "force",
    description: "Настройка преждевременных уведомлений",
    public: true,
  },
  {
    label: "Бамп баны",
    value: "bumpBan",
    description: "Кд5 система",
    public: true,
  },
  {
    label: "Логгирование",
    value: "logging",
    description: "Логи для каждого события",
    public: true,
  },
  {
    label: "Поинты",
    value: "points",
    description: "Система баллов",
    public: true,
  },
  {
    label: "Телеграмм уведомления",
    value: "telegram",
    description: "Включить/Выключить напоминания в телеграмме для сервера",
    public: true,
  },
  {
    label: "Брендирование",
    value: "theming",
    description: "Кастом аватар, баннер и тема",
    public: true,
  },
  {
    label: "Шаблоны напоминаний",
    value: "templates",
    description: "Кастомные сообщения для напоминаний",
    public: true,
  },
  {
    label: "Логи дев сервера",
    value: "devlogs",
    description: "Логи для сервера разработчиков",
    public: false,
  },
  {
    label: "Вебхуки",
    value: "webhooks",
    description: "HTTP уведомления (только для разработчиков)",
    public: true,
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
    devlogs: "Логи сервера разработчиков",
    webhooks: "HTTP уведомления",
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
  devlogs: {
    pipeline: SettingsDevLogPipeline,
    access: GuildType.Developer,
  },
  webhooks: {
    pipeline: SettingsWebhookPipeline,
    access: GuildType.Common,
  },
} as const;
