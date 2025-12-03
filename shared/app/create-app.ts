import type { Interaction, Message } from "discord.js";
import { GatewayIntentBits } from "discord.js";
import { Client } from "discordx";

import { Env } from "../libs/config/index.js";
import { logger } from "../libs/logger/index.js";

export function createAppBoilerplate() {
  const client = new Client({
    intents: [
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
    ],
    silent: Env.AppEnv !== "dev",
    logger,
    simpleCommand: {
      prefix: "!",
    },
  });

  client.once("ready", async () => {
    async function initCommands(__retries = 0) {
      if (__retries < 3) {
        try {
          await client.initApplicationCommands().catch(logger.error);
        } catch (err) {
          await client.clearApplicationCommands();
          await initCommands(__retries + 1);
          logger.error(err);
        }
      }
    }
    await initCommands();
  });

  client.on("interactionCreate", (interaction: Interaction) => {
    try {
      void client.executeInteraction(interaction);
    } catch (err) {
      logger.error(err);
    }
  });

  client.on("messageCreate", (message: Message) => {
    try {
      void client.executeCommand(message);
    } catch (err) {
      logger.error(err);
    }
  });

  return client;
}
