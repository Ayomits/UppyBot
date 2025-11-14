import "reflect-metadata";

import { registerTelegramConsumers } from "#/queue/routes/index.js";
import { createStoreConnection } from "#/shared/db/connections.js";

import { startApp } from "./app/app.js";
import { telegramApp } from "./client.js";

async function start() {
  await createStoreConnection({
    mongo: { dbName: "UppyNotifications", autoCreate: false },
  });
  await registerTelegramConsumers();
  await startApp(telegramApp);
}

start();
