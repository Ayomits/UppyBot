// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { Snowflake } from "discord.js";
import mongoose from "mongoose";

import { Env } from "#/libs/config/index.js";
import { BumpLogCollectionName, BumpLogSchema } from "#/models/bump.model";
import {
  BumpGuildCalendarCollectionName,
  BumpGuildCalendarSchema,
} from "#/models/bump-guild-calendar.model";
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
    _id: string;
    timestamp: Date;
    guildId: Snowflake;
    executorId: Snowflake;
  }>([
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%d.%m.%Y",
            date: "$createdAt",
            timezone: "Europe/Moscow",
          },
        },
        timestamp: { $first: "$createdAt" },
        guildId: { $first: "$guildId" },
        executorId: { $first: "$executorId" },
      },
    },
  ]);

  const [guildCalendars, userCalendars] = [[], []];

  for (const doc of docs) {
    guildCalendars.push({
      guildId: doc.guildId,
      formatted: doc._id,
      timestamp: doc.timestamp
    });
    userCalendars.push({
      guildId: doc.guildId,
      userId: doc.executorId,
      formatted: doc._id,
      timestamp: doc.timestamp
    });
  }

  await Promise.all([
    BumpGuildCalendarModel.insertMany(guildCalendars),
    BumpUserCalendarModel.insertMany(userCalendars),
  ]);
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
}
