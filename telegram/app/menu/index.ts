import type { Bot } from "grammy";

import type { AppContext } from "#/telegram/utils/ctx.js";

import { oauth2Menu } from "./oauth2_menu/index.js";
import { profileMenu } from "./profile_menu/index.js";
import { guildsMenu } from "./profile_menu/settings_menu/guilds_menu/index.js";
import { settingsMenu } from "./profile_menu/settings_menu/index.js";
import { notificationsMenu } from "./profile_menu/settings_menu/notifications_menu/index.js";

export function initMenus(app: Bot<AppContext>) {
  // OAUTH2
  app.use(oauth2Menu);

  // SETTINGS
  settingsMenu.register([notificationsMenu, guildsMenu]);

  // PROFILE
  profileMenu.register(settingsMenu);
  app.use(profileMenu);
}
