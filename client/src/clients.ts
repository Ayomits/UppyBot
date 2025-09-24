import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import { LocalCache } from "@ts-fetcher/cache";
import type { Snowflake } from "discord.js";
import { GatewayIntentBits, type Interaction, type Message } from "discord.js";
import { Client, DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "tsyringe";

import { Env } from "./libs/config/index.js";
import { logger } from "./libs/logger/logger.js";
import type { LiteralEnum } from "./libs/utils/types.js";

const ClientName = {
  Uppy: "uppy",
  Core: "core",
  Logs: "logs",
} as const;

type ClientName = LiteralEnum<typeof ClientName>;

type ReplicationValue = { name: ClientName; client: Client };

export class ClientManager {
  private clients: LocalCache<ClientName, Client>;
  private replications: LocalCache<Snowflake, ReplicationValue>;

  constructor() {
    this.clients = new LocalCache();
    this.replications = new LocalCache();
  }

  async createLogsClient() {
    return await this.createClient("logs");
  }
  async createCoreClient() {
    return await this.createClient("core");
  }
  async createUppyClient() {
    return await this.createClient("uppy");
  }

  private async createClient(name: ClientName) {
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

    await importx(`${dirname(import.meta.url)}/apps/${name}/**/*.js`);

    return client;
  }
}

export const clientManager = new ClientManager();
