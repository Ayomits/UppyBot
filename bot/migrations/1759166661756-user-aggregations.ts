/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import mongoose from "mongoose";

import { Env } from "#/libs/config/index";
import { BumpLogCollectionName } from "#/models/bump-log.model";
import { BumpUserCollectionName } from "#/models/bump-user.model";
import { RemindType } from "#/models/remind-logs.model";

export async function up(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);

  const docs = await mongoose.connection
    .collection(BumpLogCollectionName)
    .aggregate([
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            executorId: "$executorId",
            guildId: "$guildId",
          },
          points: { $sum: "$points" },
          sdcMonitoring: {
            $sum: {
              $cond: [{ $eq: ["$type", RemindType.SdcMonitoring] }, 1, 0],
            },
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
    ])
    .toArray();

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

  await mongoose.connection
    .collection(BumpUserCollectionName)
    .insertMany(userBumps);

  await mongoose.connection.close();
}

export async function down(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);
  await mongoose.connection.collection(BumpUserCollectionName).deleteMany({});

  await mongoose.connection.close();
}
