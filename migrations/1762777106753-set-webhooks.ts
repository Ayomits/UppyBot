// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck no check means no fucking check!
import mongoose from "mongoose";

import { SettingsCollectionName } from "#/db/models/settings.model";
import { Env } from "#/libs/config/index";

export async function up(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);

  // migration

  await mongoose.connection.collection(SettingsCollectionName).updateMany(
    {},
    {
      $set: {
        webhooks: {
          url: null,
          token: null,
        },
      },
    },
  );

  await mongoose.connection.close();
}

export async function down(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);

  await mongoose.connection.collection(SettingsCollectionName).updateMany(
    {},
    {
      $unset: "webhooks",
    },
  );

  await mongoose.connection.close();
}
