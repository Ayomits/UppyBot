import type { ObjectKeys } from "@fear/utils";

import type { Settings } from "#/models/settings.model.js";

export const SettingsCustomIds = {
  buttons: {
    managers: {
      roles: "settings-manage-roles",
      channels: "settings-manage-channels",
      award: "settings-manage-awards",
    },
    actions: {
      setForceTime: "settings-set-force-time",
      toggleUseForce: "settings-use-force-only",
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
      role: {
        action: "settings-manager-role-action",
        backward: "settings-manager-role-backward",
      },
      channel: {
        action: "settings-manager-channels-action",
        backward: "settings-manager-channels-backward",
      },
      award: {
        action: "settings-manager-award-action",
        backward: "settings-manager-award-backward",
      },
    },
  },
  modal: {
    setForceTime: "settings-set-force-modal",
    manageAward: "settings-manage-award-modal",
  },
} as const;

export const MULTIPLE_ROLE_SELECT_FIELDS: ObjectKeys<Settings>[] = [
  "bumpRoleIds",
];
