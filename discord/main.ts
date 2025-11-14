import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import type { Interaction, Message } from "discord.js";
import { DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "tsyringe";

import { createStoreConnection } from "#/shared/db/connections.js";

import { registerDiscordConsumers } from "../queue/routes/index.js";
import { Env } from "../shared/libs/config/index.js";
import { logger } from "../shared/libs/logger/logger.js";
import { discordClient } from "./client.js";

async function createClient() {
  DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);

  discordClient.once("ready", async () => {
    async function initCommands(__retries = 0) {
      if (__retries < 3) {
        try {
          await discordClient.initApplicationCommands().catch(logger.error);
        } catch (err) {
          await discordClient.clearApplicationCommands();
          await initCommands(__retries + 1);
          logger.error(err);
        }
      }
    }
    await initCommands();
  });

  discordClient.on("interactionCreate", (interaction: Interaction) => {
    try {
      void discordClient.executeInteraction(interaction);
    } catch (err) {
      logger.error(err);
    }
  });

  discordClient.on("messageCreate", (message: Message) => {
    try {
      void discordClient.executeCommand(message);
    } catch (err) {
      logger.error(err);
    }
  });

  await importx(`${dirname(import.meta.url)}/app/**/*.js`);

  await discordClient.login(Env.DiscordToken);
}

async function start() {
  await createStoreConnection({ mongo: { dbName: "Uppy" } });
  await registerDiscordConsumers();
  await createClient().then(() => logger.success("Bot successfully connected"));
}

start();
