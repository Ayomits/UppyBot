import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import { Env } from "@fear/config";
import { mongoose } from "@typegoose/typegoose";
import { GatewayIntentBits, type Interaction, type Message } from "discord.js";
import { Client, DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "tsyringe";

import { logger } from "./libs/logger/logger.js";

export async function helper() {
  DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
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
          await client.initApplicationCommands();
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

  await importx(`${dirname(import.meta.url)}/**/*.js`);

  await mongoose
    .connect(Env.MongoUrl, {
      autoCreate: true,
    })
    .catch(logger.error)
    .then(() => logger.success("succesfully connected to mongodb"));

  await client.login(Env.HelperToken).then(() => {
    logger.success("Successfully logged in");
  });
}
helper();
