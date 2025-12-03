import "reflect-metadata";

import { dirname, importx } from "@discordx/importer";
import { DIService, tsyringeDependencyRegistryEngine } from "discordx";
import { container } from "tsyringe";

import { createStoreConnection } from "#/shared/db/connections.js";
import { createMainMongoConnection } from "#/shared/db/mongo.js";

import { registerDiscordConsumers } from "../queue/routes/index.js";
import { Env } from "../shared/libs/config/index.js";
import { logger } from "../shared/libs/logger/index.js";
import { discordClient } from "./client.js";

async function createClient() {
  DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
  await importx(`${dirname(import.meta.url)}/app/**/*.js`);
  await discordClient.login(Env.DiscordToken);
}

async function start() {
  await createStoreConnection();
  await createMainMongoConnection();
  await registerDiscordConsumers();
  await createClient().then(() => logger.success("Bot successfully connected"));
}

start();
