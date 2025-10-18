import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import { mongoose } from "@typegoose/typegoose";
import type { Interaction, Message } from "discord.js";
import { GatewayIntentBits } from "discord.js";
import { Client, DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "tsyringe";

import { Env } from "./libs/config/index.js";
import { logger } from "./libs/logger/logger.js";

async function bootstrap() {
  DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
  await mongoose
    .connect(Env.MongoUrl, {
      autoCreate: true,
      dbName: Env.MongoDbName,
    })
    .catch(logger.error)
    .then(() => logger.success("succesfully connected to mongodb"));

  const client = new Client({
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

  client.login(Env.DiscordToken);
}

bootstrap();
