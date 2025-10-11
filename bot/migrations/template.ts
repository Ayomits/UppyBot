/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck no check means no fucking check!
import mongoose from "mongoose";

import { Env } from "#/libs/config/index";

export async function up(): Promise<void> {
  const connection = await mongoose.connect(Env.MongoUrl);
}

export async function down(): Promise<void> {
  const connection = await mongoose.connect(Env.MongoUrl);
}
