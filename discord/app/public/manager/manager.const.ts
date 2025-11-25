import type { LiteralEnum } from "#/shared/libs/djs/types.js";

export const ManagerPanelIds = {
  modal: "@manager/modal",
  button: "@manager/action",
  usrSelect: "@manager/usrselect"
} as const;

export const ManagerPanelAction = {
  bumpBanRemoval: "bbremoval",
  bumpBanCreation: "bbcreation",
  channelClose: "channelclose",
  channelOpen: "channelopen",
} as const;

export type ManagerPanelAction = LiteralEnum<typeof ManagerPanelAction>;
