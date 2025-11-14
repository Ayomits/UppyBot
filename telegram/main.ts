import "reflect-metadata";

import { registerTelegramConsumers } from "#/queue/routes/index.js";
import { createStoreConnection } from "#/shared/db/connections.js";
import {
  createMainMongoConnection,
  createNotificationsMongoConnection,
} from "#/shared/db/mongo.js";

import { startApp } from "./app/app.js";
import { telegramApp } from "./client.js";

async function start() {
  await createStoreConnection();
  await createMainMongoConnection();
  await createNotificationsMongoConnection();
  await registerTelegramConsumers();
  await startApp(telegramApp);
}

start();
