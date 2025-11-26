// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import mongoose from "mongoose";

import { Env } from "#/shared/libs/config/index";

export async function up(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);

  // migration
  await mongoose.connection.db?.collection("bump_bans").updateMany(
    {},
    {
      $rename: {
        removeIn: "counter",
      },
    }
  );
  await mongoose.connection.close();
}

export async function down(): Promise<void> {
  await mongoose.connect(Env.MongoUrl);

  // migration
  await mongoose.connection.db?.collection("bump_bans").updateMany(
    {},
    {
      $rename: {
        counter: "removeIn",
      },
    }
  );
  await mongoose.connection.close();
}
