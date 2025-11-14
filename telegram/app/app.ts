import type { Bot } from "grammy";

import type { AppContext } from "../utils/ctx.js";
import { logger } from "../utils/logger.js";
import { initCommands } from "./commands/index.js";
import { initMenus } from "./menu/index.js";
import { initMiddlewares } from "./middlewares/index.js";

export async function startApp(app: Bot<AppContext>) {
  initMiddlewares(app);
  initMenus(app);
  await initCommands(app);

  app.catch = (err) => logger.error(err);

  app.start({
    onStart: () =>
      logger.success(`Successfully logged as: ${app.botInfo.first_name}`),
    allowed_updates: [
      "chat_member",
      "message",
      "callback_query",
      "my_chat_member",
    ],
  });
}
