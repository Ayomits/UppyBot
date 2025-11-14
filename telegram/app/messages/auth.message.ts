import { oauth2Menu } from "../menu/oauth2_menu/index.js";

export function createRequireAuthMessage() {
  return {
    text: `Требуется авторизация`,
    reply_markup: oauth2Menu,
  };
}
