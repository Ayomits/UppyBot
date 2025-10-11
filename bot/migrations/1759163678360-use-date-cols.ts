// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { Snowflake } from "discord.js";
import mongoose from "mongoose";

import { Env } from "#/libs/config/index";
import {
  BumpGuildCalendarCollectionName,
  BumpGuildCalendarSchema,
} from "#/models/bump-guild-calendar.model";
import { BumpLogCollectionName, BumpLogSchema } from "#/models/bump-log.model";
import {
  BumpUserCalendarCollectionName,
  BumpUserCalendarSchema,
} from "#/models/bump-user-calendar.model";

export async function up(): Promise<void> {
  const connection = await mongoose.connect(Env.MongoUrl, { autoCreate: true });
  const BumpLogModel = connection.model(BumpLogCollectionName, BumpLogSchema);
  const BumpGuildCalendarModel = connection.model(
    BumpGuildCalendarCollectionName,
    BumpGuildCalendarSchema
  );
  const BumpUserCalendarModel = connection.model(
    BumpUserCalendarCollectionName,
    BumpUserCalendarSchema
  );

  const docs = await BumpLogModel.aggregate<{
    formattedDate: string;
    timestamp: Date;
    guildId: Snowflake;
    executorId: Snowflake;
  }>([
    {
      $group: {
        _id: {
          formattedDate: {
            $dateToString: {
              format: "%d.%m.%Y",
              date: "$createdAt",
              timezone: "Europe/Moscow",
            },
          },
          guildId: "$guildId",
          executorId: "$executorId",
        },
        timestamp: { $first: "$createdAt" },
        guildId: { $first: "$guildId" },
        executorId: { $first: "$executorId" },
      },
    },
    {
      $project: {
        formattedDate: "$_id.formattedDate",
        timestamp: 1,
        guildId: 1,
        executorId: 1,
        _id: 0,
      },
    },
  ]);

  const guildCalendars = [];
  const userCalendars = [];
  const processedGuildDays = new Set();
  const processedUserDays = new Set();

  for (const doc of docs) {
    const guildKey = `${doc.guildId}-${doc.formattedDate}`;
    const userKey = `${doc.guildId}-${doc.executorId}-${doc.formattedDate}`;

    if (!processedGuildDays.has(guildKey)) {
      guildCalendars.push({
        guildId: doc.guildId,
        formatted: doc.formattedDate,
        timestamp: doc.timestamp,
      });
      processedGuildDays.add(guildKey);
    }

    if (!processedUserDays.has(userKey)) {
      userCalendars.push({
        guildId: doc.guildId,
        userId: doc.executorId,
        formatted: doc.formattedDate,
        timestamp: doc.timestamp,
      });
      processedUserDays.add(userKey);
    }
  }

  if (guildCalendars.length > 0) {
    await BumpGuildCalendarModel.insertMany(guildCalendars);
  }

  if (userCalendars.length > 0) {
    await BumpUserCalendarModel.insertMany(userCalendars);
  }

  connection.deleteModel(BumpLogModel.modelName);
  connection.deleteModel(BumpGuildCalendarModel.modelName);
  connection.deleteModel(BumpUserCalendarModel.modelName);
}

export async function down(): Promise<void> {
  const connection = await mongoose.connect(Env.MongoUrl);
  const BumpGuildCalendarModel = connection.model(
    BumpGuildCalendarCollectionName,
    BumpGuildCalendarSchema
  );
  const BumpUserCalendarModel = connection.model(
    BumpUserCalendarCollectionName,
    BumpUserCalendarSchema
  );

  await Promise.all([
    BumpGuildCalendarModel.deleteMany(),
    BumpUserCalendarModel.deleteMany(),
  ]);

  connection.deleteModel(BumpGuildCalendarModel.modelName);
  connection.deleteModel(BumpUserCalendarModel.modelName);
}
