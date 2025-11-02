/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck no check means no fucking check!
import mongoose from "mongoose";

import { Env } from "#/libs/config/index";
import {
  RemindLogsCollectionName,
  RemindLogState,
  RemindType,
} from "#/models/remind-logs.model";

export async function up(): Promise<void> {
  const connection = await mongoose.connect(Env.MongoUrl);

  await mongoose.connection
    .collection(RemindLogsCollectionName)
    .updateMany({}, [
      {
        $set: {
          monitoring: "$type",
          state: RemindLogState.Created,
          type: {
            $cond: {
              if: ["$isForce", true],
              then: RemindType.Force,
              else: RemindType.Common,
            },
          },
        },
      },
      {
        $unset: ["isForce"],
      },
    ]);
    
  await mongoose.connection.close();
}

export async function down(): Promise<void> {
  const connection = await mongoose.connect(Env.MongoUrl);
  await mongoose.connection
    .collection(RemindLogsCollectionName)
    .updateMany({}, [
      {
        $set: {
          type: "$monitoring",
          isForce: {
            $cond: {
              if: ["$type", RemindType.Force],
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $unset: ["monitoring", "state", "isSended"],
      },
    ]);
  await mongoose.connection.close();
}
