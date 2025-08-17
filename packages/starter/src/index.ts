import "reflect-metadata";

import type { Interaction, Message } from "discord.js";
import { GatewayIntentBits } from "discord.js";
import {
  Client,
  type ClientOptions,
  DIService,
  tsyringeDependencyRegistryEngine,
} from "discordx";
import { container } from "tsyringe";

export const IMPORT_PATTERN = `./**/*.controller.js`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadImports(_: any, matches: string[]) {
  matches.forEach(
    (match) => import(`.${match.replace("src", "").replace("dist", "")}`)
  );
}

export function createProject(
  token: string,
  options?: Partial<ClientOptions> & {
    env?: string;
  }
) {
  const main = async () => {
    const { env = "dev", ...rest } = options;
    DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
    const client = new Client({
      intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
      ],
      silent: env !== "dev",
      simpleCommand: {
        prefix: "!",
      },
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

    await client.login(token).then(() => {
      console.log("Successfully logged in");
    });
  };
  main();
}
