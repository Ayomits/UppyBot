import { Bot } from "grammy";

import { configService } from "#/shared/libs/config/index.js";
import { logger } from "#/shared/libs/logger/index.js";

import type { AppContext } from "./utils/ctx.js";
import { Emojis } from "./utils/emojis.js";

export const telegramApp = new Bot<AppContext>(
  configService.getOrThrow("TELEGRAM_TOKEN"),
);

telegramApp.catch((err) => {
  const ctx = err.ctx;

  try {
    ctx.reply(`${Emojis.DIZZY_FACE} Произошла внутренняя ошибка...`);
  } catch (err) {
    logger.error(err);
  }
  logger.error(err);
});
