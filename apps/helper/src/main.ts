import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import { Env } from "@fear/config";
import { mongoose } from "@typegoose/typegoose";
import { GatewayIntentBits, type Interaction, type Message } from "discord.js";
import { Client, DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "tsyringe";

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
          console.error(err);
        }
      }
    }
    await initCommands();
  });

  client.on("interactionCreate", (interaction: Interaction) => {
    try {
      void client.executeInteraction(interaction);
    } catch (err) {
      console.error(err);
    }
  });

  client.on("messageCreate", (message: Message) => {
    try {
      void client.executeCommand(message);
    } catch (err) {
      console.error(err);
    }
  });

  await importx(`${dirname(import.meta.url)}/**/*.js`);

  await mongoose
    .connect(Env.MongoUrl, {
      autoCreate: true,
    })
    .catch(console.error)
    .then(() => console.log("succesfully connected to mongodb"));

  await client.login(Env.HelperToken).then(() => {
    console.log("Successfully logged in");
  });
}
helper();
