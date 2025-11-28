import type { ObjectKeys } from "#/shared/libs/djs/types.js";

import type { SettingsPipelines } from "./settings.config.js";

export const SettingsIds = {
  select: "@settings/base-select",
  change: "@settings/base-change",
  toggle: "@settings/base-toggle",
  navigation: "@settings/base-nav",
  refresh: "@settings/refresh",
};

export const forceModalId = "@settings/force";
export const pointModalId = "@settings/points";
export const templateModalId = "@settings/modal";
export const brandinModalId = "@settings/branding";

export const SettingsStartPipeline: ObjectKeys<typeof SettingsPipelines> =
  "reminds";
