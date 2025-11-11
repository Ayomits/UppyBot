/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck no check means no fucking check!
import mongoose from "mongoose";

import { Env } from "#/libs/config/index";
import { SettingsCollectionName } from "#/models/settings.model";

export async function up(): Promise<void> {
  const connection = await mongoose.connect(Env.MongoUrl);

  await mongoose.connection
    .collection(SettingsCollectionName)
    .updateMany({ logChannelId: { $exists: true } }, [
      { $set: { actionLogChannelId: "$logChannelId" } },
      { $unset: ["logChannelId"] },
    ]);
}

export async function down(): Promise<void> {
  const connection = await mongoose.connect(Env.MongoUrl);

  await mongoose.connection
    .collection(SettingsCollectionName)
    .updateMany({ actionLogChannelId: { $exists: true } }, [
      {
        $set: {
          logChannelId: "$actionLogChannelId",
        },
      },
      {
        $unset: ["actionLogChannelId"],
      },
    ]);
}
