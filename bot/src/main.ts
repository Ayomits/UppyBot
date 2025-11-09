import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import type { Interaction, Message } from "discord.js";
import { DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "tsyringe";

import { client } from "./client.js";
import { createDb } from "./db/mongo.js";
import { createRabbitConnection } from "./db/rabbitmq.js";
import { createRedisConnection } from "./db/redis.js";
import { Env } from "./libs/config/index.js";
import { logger } from "./libs/logger/logger.js";
import { registerConsumers } from "./queue/routes/index.js";

async function createClient() {
  DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);

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

  await importx(`${dirname(import.meta.url)}/app/**/*.js`);

  await client.login(Env.DiscordToken);
}

async function start() {
  await createDb().then(() => logger.success("Mongodb successfully connected"));
  await createRedisConnection().then(() =>
    logger.success("Redis successfully connected")
  );
  await createRabbitConnection().then(() =>
    logger.success("Rabbitmq connected")
  );
  await registerConsumers();
  await createClient().then(() => logger.success("Bot successfully connected"));
}

start();
