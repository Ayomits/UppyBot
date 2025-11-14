import { Menu } from "@grammyjs/menu";

import type { AppContext } from "#/telegram/utils/ctx.js";
import { Emojis } from "#/telegram/utils/emojis.js";

import { protectedInteraction } from "../../middlewares/protected-interaction.js";
import { settingsMenuId } from "./settings_menu/index.js";

export const profileMenuId = "profile_menu";

export const profileMenu = new Menu<AppContext>(profileMenuId).submenu(
  `${Emojis.SAFETY_PIN} Настройки`,
  settingsMenuId,
  protectedInteraction
);
