/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck no check means no fucking check!
import mongoose from "mongoose";

import { Env } from "#/libs/config/index";
import { SettingsCollectionName } from "#/models/settings.model";

export async function up(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);

  await mongoose.connection
    .collection(SettingsCollectionName)
    .updateMany({ remind: { $exists: true } }, [
      {
        $set: {
          "force.enabled": false,
          "force.seconds": "$remind.force",
          "force.useForceOnly": "$remind.useForceOnly",
        },
      },
    ]);

  await mongoose.connection.close();
}

export async function down(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);

  await mongoose.connection
    .collection(SettingsCollectionName)
    .updateMany({ force: { $exists: true } }, [
      {
        $set: {
          "remind.seconds": "$force.seconds",
          "remind.useForceOnly": "$force.useForceOnly",
        },
      },
    ]);

  await mongoose.connection.close();
}
