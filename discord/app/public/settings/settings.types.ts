import type { ChannelType, LabelBuilder } from "discord.js";

import type { GuildType } from "#/shared/db/models/uppy-discord/guild.model.js";
import type { SettingsDocument } from "#/shared/db/models/uppy-discord/settings.model.js";

export type SettingsConfig = {
  access?: GuildType;
  label: string;
  field: string;
  type: "channel" | "role" | "value" | "toggle";
  display?: (settings: SettingsDocument) => string;
  select?: {
    choice: "multi" | "single";
    placeholder: string;
    channelTypes?: ChannelType[];
  };
  toggle?: boolean;
  modal?: {
    title: string;
    customId: string;
    fields: (settings: SettingsDocument) => LabelBuilder[];
  };
};

export type SettingsPipelineConfig = Record<string, SettingsConfig>;
