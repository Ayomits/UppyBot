import {
  buildSchema,
  type DocumentType,
  index,
  prop,
} from "@typegoose/typegoose";
import type { Snowflake } from "discord.js";

import { mainMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

@index({ guildId: 1, userId: 1, createdAt: 1 })
export class BumpUser {
  @prop({ required: true })
  guildId: Snowflake;

  @prop({ required: true })
  userId: Snowflake;

  @prop({ required: true, default: Date.now() })
  timestamp: Date;

  @prop({ required: true, default: 0 })
  points: number;

  @prop({ required: true, default: 0 })
  dsMonitoring: number;

  @prop({ required: true, default: 0 })
  sdcMonitoring: number;

  @prop({ required: true, default: 0 })
  serverMonitoring: number;

  @prop({ required: true, default: 0 })
  disboardMonitoring: number;
}

export const BumpUserSchema = buildSchema(BumpUser);

export const BumpUserCollectionName = "bump_users";

export const BumpUserModel = createLazyModel(
  () => mainMongoConnection,
  BumpUser,
  {
    options: { customName: BumpUserCollectionName },
    existingConnection: mainMongoConnection!,
  },
);

export type BumpUserDocument = DocumentType<BumpUser>;
