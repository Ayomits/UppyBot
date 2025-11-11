import Fastify from "fastify";

import { createStoreConnection } from "#/shared/db/connections.js";

async function start() {
  const app = Fastify({
    logger: {
      enabled: true,
      name: "UppyNotifications",
    },
  });

  app.listen({ port: 4200 }, async () => {
    await createStoreConnection();
  });
}

start();
