import { bold, inlineCode } from "#/telegram/utils/html-markdown.js";

import { oauth2Menu } from "../menu/oauth2_menu/index.js";

export function createRequireAuthMessage() {
  return {
    text: [
      `Вы ${bold("не")} авторизированы в боте`,
      `Перейдите по ссылке ниже и авторизируйтесь в течение ${bold("2х")} минут`,
      `Если вы не успели, пропишите команду ${inlineCode(`start`)} заново`,
    ].join("\n"),
    reply_markup: oauth2Menu,
    parse_mode: "Markdown",
    shouldContinue: false,
  };
}
