import {
  bold,
  ChannelType,
  LabelBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { GuildType } from "#/shared/db/models/uppy-discord/guild.model.js";
import type { SettingsDocument } from "#/shared/db/models/uppy-discord/settings.model.js";

import { pointModalId } from "./settings.const.js";
import type {
  SettingsConfig,
  SettingsPipelineConfig,
} from "./settings.types.js";

export const baseConfigs = {
  multiRole: (
    field: string,
    label: string,
    access: GuildType = GuildType.Common,
  ): SettingsConfig => ({
    label,
    field,
    type: "role",
    select: { choice: "multi", placeholder: "Выберите роли" },
    access,
  }),

  singleChannel: (
    field: string,
    label: string,
    access: GuildType = GuildType.Common,
  ): SettingsConfig => ({
    label,
    field,
    type: "channel",
    select: {
      choice: "single",
      placeholder: "Выберите канал",
      channelTypes: [ChannelType.GuildText],
    },
    access,
  }),

  toggle: (
    field: string,
    label: string,
    access: GuildType = GuildType.Common,
  ): SettingsConfig => ({
    label,
    field,
    type: "toggle",
    toggle: true,
    access,
  }),
};

export const createPointsMonitoringConfig = (
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
    customId: `${pointModalId}_points.${service}`,
    fields: (settings: SettingsDocument) => [
      new LabelBuilder()
        .setLabel("Обычно")
        .setTextInputComponent(
          createNumberInput("default", settings.points?.[service]?.default),
        ),
      new LabelBuilder()
        .setLabel("Бонус")
        .setTextInputComponent(
          createNumberInput("bonus", settings.points?.[service]?.bonus),
        ),
    ],
  },
});

export const createNumberInput = (id: string, value?: number) =>
  new TextInputBuilder()
    .setCustomId(id)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("1")
    .setValue(value?.toString() || "1");

export const createPipeline = (pipe: SettingsPipelineConfig) => {
  return pipe;
};

export const createConfig = (cfg: SettingsConfig) => {
  return cfg;
};
