import { Env } from "#/libs/config/index.js";

export default {
  uri: Env.MongoUrl,
  collection: "migrations",
  dbName: "test",
  migrationsPath: "./migrations",
  templatePath: "./migrations/template.ts",
  autoIndex: true,
  autoCreate: true,
};
