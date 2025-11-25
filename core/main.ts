import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import type { Interaction, Message } from "discord.js";
import { DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "tsyringe";

import { createStoreConnection } from "#/shared/db/connections.js";
import { createMainMongoConnection } from "#/shared/db/mongo.js";

import { registerDiscordConsumers } from "../queue/routes/index.js";
import { Env } from "../shared/libs/config/index.js";
import { logger } from "../shared/libs/logger/logger.js";
import { coreClient } from "./client.js";

async function createClient() {
  DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);

  coreClient.once("ready", async () => {
    async function initCommands(__retries = 0) {
      if (__retries < 3) {
        try {
          await coreClient.initApplicationCommands().catch(logger.error);
        } catch (err) {
          await coreClient.clearApplicationCommands();
          await initCommands(__retries + 1);
          logger.error(err);
        }
      }
    }
    await initCommands();
  });

  coreClient.on("interactionCreate", (interaction: Interaction) => {
    try {
      void coreClient.executeInteraction(interaction);
    } catch (err) {
      logger.error(err);
    }
  });

  coreClient.on("messageCreate", (message: Message) => {
    try {
      void coreClient.executeCommand(message);
    } catch (err) {
      logger.error(err);
    }
  });

  await importx(`${dirname(import.meta.url)}/app/**/*.js`);

  await coreClient.login(Env.DiscordToken);
}

async function start() {
  await createStoreConnection();
  await createMainMongoConnection();
  await registerDiscordConsumers();
  await createClient().then(() => logger.success("Bot successfully connected"));
}

start();
