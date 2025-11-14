import { Bot } from "grammy";

import { configService } from "#/shared/libs/config/index.js";

import type { AppContext } from "./utils/ctx.js";
import { logger } from "./utils/logger.js";

export const telegramApp = new Bot<AppContext>(
  configService.getOrThrow("TELEGRAM_TOKEN"),
);

telegramApp.catch = (err) => logger.error(err);
