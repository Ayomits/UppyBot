import { buildSchema, type DocumentType, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";
import type { Snowflake } from "discord.js";

import type { LiteralEnum } from "#/shared/libs/djs/types.js";

import { mainMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

export const BumpLogSourceType = {
  Web: 0,
  Discord: 1,
} as const;

export type BumpLogSourceType = LiteralEnum<typeof BumpLogSourceType>;

export class BumpLog extends TimeStamps {
  @prop({ required: true, index: true, alias: "guild_id" })
  guildId: Snowflake;

  @prop({ required: true, index: true })
  type: number;

  @prop({ required: true, index: true, alias: "author_id" })
  executorId: Snowflake;

  @prop({ required: true })
  source: number;

  @prop({
    required: false,
    default: null,
    alias: "message_id",
  })
  messageId: string | null;

  @prop({ required: true, default: 0, min: 0 })
  points: number;
}

export const BumpLogCollectionName = "bumps";

export const BumpLogSchema = buildSchema(BumpLog);

export const BumpLogModel = createLazyModel(
  () => mainMongoConnection,
  BumpLog,
  {
    options: {
      customName: BumpLogCollectionName,
    },
  }
);

export type BumpLogDocument = DocumentType<BumpLog>;
