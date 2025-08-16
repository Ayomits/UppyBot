import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import type { Interaction, Message } from "discord.js";
import { GatewayIntentBits } from "discord.js";
import {
  Client,
  type ClientOptions,
  DIService,
  tsyringeDependencyRegistryEngine,
} from "discordx";
import { container } from "tsyringe";

export function createProject(
  token: string,
  options?: Partial<ClientOptions> & { env?: string },
) {
  const main = async () => {
    const { env, ...rest } = options;
    DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
    const client = new Client({
      intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
      ],
      simpleCommand: {
        prefix: "!",
      },
      silent: env !== "dev",
      botGuilds:
        env === "dev"
          ? [
              "1265957323193716788",
              "532331179760812033",
              "1391117548036165752",
              "1369790516627247255",
            ]
          : undefined,
      ...rest,
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

    await importx(`${dirname(import.meta.url)}/**/!(*.d).{ts,js}`);

    await client.login(token).then(() => {
      console.log("Successfully logged in");
    });
  };
  main();
}
