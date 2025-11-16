import "reflect-metadata";

import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import ejs from "ejs";
import Fastify from "fastify";
import { dirname, join } from "path";
import qs from "qs";
import { fileURLToPath } from "url";

import { createStoreConnection } from "#/shared/db/connections.js";
import { createNotificationsMongoConnection } from "#/shared/db/mongo.js";
import { logger } from "#/shared/libs/logger/logger.js";

import { registerDiscordAuthController } from "./controllers/discord-auth.controller.js";
import { registerUppyNotificationController } from "./controllers/uppy-notifications.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function start() {
  const app = Fastify({
    querystringParser: (str) => qs.parse(str),
  });

  app.register(fastifyView, {
    engine: {
      ejs: ejs,
    },
    root: join(__dirname, "../../templates"),
    viewExt: "ejs",
  });

  app.register(fastifyStatic, {
    root: join(__dirname, "../../templates"),
    prefix: "/public/",
  });

  registerDiscordAuthController(app);
  registerUppyNotificationController(app);

  await createStoreConnection();
  await createNotificationsMongoConnection();

  app.listen({ port: 4200, host: "0.0.0.0" }, async () => {
    logger.info(`Server started: http://localhost:4200`);
  });
}

start();
