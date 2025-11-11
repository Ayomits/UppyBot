// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck no check means no fucking check!
import mongoose from "mongoose";

import {
  BumpLogCollectionName,
  BumpLogSourceType,
} from "#/db/models/bump-log.model";
import { Env } from "#/libs/config/index";

export async function up(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);

  await mongoose.connection
    .collection(BumpLogCollectionName)
    .updateMany(
      { source: { $ne: BumpLogSourceType.Web } },
      { $set: { source: BumpLogSourceType.Discord } },
    );

  try {
    await mongoose.connection
      .collection(BumpLogCollectionName)
      .dropIndex("messageId_1");
  } catch (error) {
    if (error.code !== 27) {
      throw error;
    }
  }

  await mongoose.connection.close();
}

export async function down(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);

  try {
    await mongoose.connection.collection(BumpLogCollectionName).createIndex(
      { messageId: 1 },
      {
        unique: true,
        sparse: true,
        name: "messageId_1",
      },
    );
  } catch {
    // 3242
  }

  await mongoose.connection.close();
}
