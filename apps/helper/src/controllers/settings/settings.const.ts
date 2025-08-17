import type { ObjectKeys } from "@fear/utils";

import type { Settings } from "#/models/settings.model.js";

export const SettingsCustomIds = {
  buttons: {
    managers: {
      roles: "settings-manage-roles",
      channels: "settings-manage-channels",
    },
    updaters: {
      panel: "settings-update-panel",
    },
  },
  selects: {
    managers: {
      roles: "settings-manager-roles",
      channels: "settings-manager-channels",
    },
    actions: {
      role: "settings-manager-role-action",
      channel: "settings-manager-channels-action",
    },
  },
} as const;

export const MULTIPLE_ROLE_SELECT_FIELDS: ObjectKeys<Settings>[] = [
  "bumpRoleIds",
];
