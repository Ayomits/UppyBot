// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck no check means no fucking check!
import mongoose from "mongoose";

import { RemindType } from "#/apps/uppy/controllers/reminder/reminder.const";
import { Env } from "#/libs/config/index";
import { BumpLogCollectionName, BumpLogSchema } from "#/models/bump-log.model";
import { BumpUserCollectionName } from "#/models/bump-user.model";
import { BumpUserSchema } from "#/models/bump-user.model";

export async function up(): Promise<void> {
  const connection = await mongoose.connect(Env.MongoUrl);
  const BumpUserModel = connection.model(
    BumpUserCollectionName,
    BumpUserSchema
  );
  const BumpLogModel = connection.model(BumpLogCollectionName, BumpLogSchema);

  const docs = await BumpLogModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date("2024-01-01"),
          $lte: Date.now(),
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          executorId: "$executorId",
          guildId: "$guildId",
        },
        points: { $sum: "$points" },
        sdcMonitoring: {
          $sum: { $cond: [{ $eq: ["$type", RemindType.SdcMonitoring] }, 1, 0] },
        },
        dsMonitoring: {
          $sum: {
            $cond: [{ $eq: ["$type", RemindType.DiscordMonitoring] }, 1, 0],
          },
        },
        serverMonitoring: {
          $sum: {
            $cond: [{ $eq: ["$type", RemindType.ServerMonitoring] }, 1, 0],
          },
        },
        disboardMonitoring: {
          $sum: {
            $cond: [{ $eq: ["$type", RemindType.DisboardMonitoring] }, 1, 0],
          },
        },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $sort: {
        "_id.date": 1,
        points: -1,
      },
    },
  ]);

  const userBumps = [];

  for (const doc of docs) {
    userBumps.push({
      guildId: doc._id.guildId,
      userId: doc._id.executorId,
      timestamp: new Date(doc._id.date),
      points: doc.points,
      sdcMonitoring: doc.sdcMonitoring,
      dsMonitoring: doc.dsMonitoring,
      serverMonitoring: doc.serverMonitoring,
      disboardMonitoring: doc.disboardMonitoring,
    });
  }

  await BumpUserModel.insertMany(userBumps);
}

export async function down(): Promise<void> {
  const connection = await mongoose.connect(Env.MongoUrl);
  const BumpUserModel = connection.model(
    BumpUserCollectionName,
    BumpUserSchema
  );
  await BumpUserModel.deleteMany({});
}
