// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { Snowflake } from "discord.js";
import mongoose from "mongoose";

import { Env } from "#/libs/config/index";
import { BumpGuildCalendarCollectionName } from "#/models/bump-guild-calendar.model";
import { BumpLogCollectionName } from "#/models/bump-log.model";
import { BumpUserCalendarCollectionName } from "#/models/bump-user-calendar.model";

export async function up(): Promise<void> {
  await mongoose.connect(Env.MongoUrl, { autoCreate: true });

  const docs = await mongoose.connection
    .collection(BumpLogCollectionName)
    .aggregate<{
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
    ])
    .toArray();

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
    await mongoose.connection
      .collection(BumpGuildCalendarCollectionName)
      .insertMany(guildCalendars);
  }

  if (userCalendars.length > 0) {
    await mongoose.connection
      .collection(BumpUserCalendarCollectionName)
      .insertMany(userCalendars);
  }

  await mongoose.connection.close();
}

export async function down(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);

  await Promise.all([
    mongoose.connection
      .collection(BumpGuildCalendarCollectionName)
      .deleteMany(),
    mongoose.connection.collection(BumpUserCalendarCollectionName).deleteMany(),
  ]);

  await mongoose.connection.close();
}
