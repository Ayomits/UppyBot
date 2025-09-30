import "reflect-metadata";

import { mongoose } from "@typegoose/typegoose";

import { clientManager } from "./clients.js";
import { Env } from "./libs/config/index.js";
import { logger } from "./libs/logger/logger.js";

async function bootstrap() {
  console.log(Env.MongoUrl);
  await mongoose
    .connect(Env.MongoUrl, {
      autoCreate: true,
    })
    .catch(logger.error)
    .then(() => logger.success("succesfully connected to mongodb"));

  const uppy = await clientManager.createUppyClient();

  uppy.login(Env.DiscordToken);
}

bootstrap();
