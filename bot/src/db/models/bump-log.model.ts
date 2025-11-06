import {
  buildSchema,
  type DocumentType,
  getModelForClass,
  prop,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";
import type { Snowflake } from "discord.js";

import type { LiteralEnum } from "#/libs/utils/types.js";

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
  source: BumpLogSourceType;

  @prop({ required: false, default: null })
  messageId: string | null;

  @prop({ required: true, default: 0, min: 0 })
  points: number;
}

export const BumpLogCollectionName = "bumps";

export const BumpLogSchema = buildSchema(BumpLog);

export const BumpLogModel = getModelForClass(BumpLog, {
  options: {
    customName: BumpLogCollectionName,
  },
});

export type BumpLogDocument = DocumentType<BumpLog>;
