import { CommandGroup } from "@grammyjs/commands";
import type { Bot } from "grammy";

import type { AppContext } from "#/telegram/utils/ctx.js";

import { startCommand } from "./start/index.js";

function initCommandsRouting() {
  const core = new CommandGroup<AppContext>();
  core.command("start", "Начать взаимодействие с ботом", startCommand);

  return core;
}

export async function initCommands(app: Bot<AppContext>) {
  const commands = initCommandsRouting();

  app.use(commands);

  await commands.setCommands(app);
}
