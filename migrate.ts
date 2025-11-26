import { Env } from "#/shared/libs/config/index.js";

import { MongoDbNames } from "./shared/db/mongo.js";

export default {
  uri: Env.MongoUrl,
  dbName: MongoDbNames.Main,
  collection: "migrations",
  migrationsPath: "./migrations",
  templatePath: "./migrations/template.ts",
  autoIndex: true,
  autoCreate: true,
  autosync: true,
};
