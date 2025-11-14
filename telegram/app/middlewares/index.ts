import { autoRetry } from "@grammyjs/auto-retry";
import { emojiParser } from "@grammyjs/emoji";
import { hydrate } from "@grammyjs/hydrate";
import type { Bot } from "grammy";

import type { AppContext } from "#/telegram/utils/ctx.js";

export function initMiddlewares(app: Bot<AppContext>) {
  app.use(hydrate());
  app.use(emojiParser());
  app.api.config.use(autoRetry());
}
