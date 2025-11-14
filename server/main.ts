import "reflect-metadata";

import Fastify from "fastify";
import qs from "qs";

import { createStoreConnection } from "#/shared/db/connections.js";
import { createNotificationsMongoConnection } from "#/shared/db/mongo.js";
import { logger } from "#/shared/libs/logger/logger.js";

import { registerDiscordAuthController } from "./controllers/discord-auth.controller.js";
import { registerUppyNotificationController } from "./controllers/uppy-notifications.controller.js";

async function start() {
  const app = Fastify({
    logger: false,
    querystringParser: (str) => qs.parse(str),
  });

  registerDiscordAuthController(app);
  registerUppyNotificationController(app);

  app.listen({ port: 4200 }, async () => {
    await createStoreConnection();
    await createNotificationsMongoConnection();
    logger.info(`Server started: http://localhost:4200`);
  });
}

start();
