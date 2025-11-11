import { GatewayIntentBits } from "discord.js";
import { Client } from "discordx";

import { Env } from "../shared/libs/config/index.js";
import { logger } from "../shared/libs/logger/logger.js";

export const client = new Client({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  silent: Env.AppEnv !== "dev",
  logger,
  simpleCommand: {
    prefix: "!",
  },
});
