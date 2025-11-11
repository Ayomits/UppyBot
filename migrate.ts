import { Env } from "#/shared/libs/config/index.js";

export default {
  uri: Env.MongoUrl,
  collection: "migrations",
  migrationsPath: "./migrations",
  templatePath: "./migrations/template.ts",
  autoIndex: true,
  autoCreate: true,
  autosync: true,
};
