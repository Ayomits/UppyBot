import {
  type DocumentType,
  getModelForClass,
  prop,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";
import type { Snowflake } from "discord.js";

import type { RemindType } from "#/modules/reminder/reminder.const.js";

export class Bump extends TimeStamps {
  @prop({ required: true, index: true, alias: "guild_id" })
  guildId: Snowflake;

  @prop({ required: true, index: true })
  type: RemindType;

  @prop({ required: true, index: true, alias: "author_id" })
  executorId: Snowflake;

  @prop({ required: true, unique: true, index: true })
  messageId: string;

  @prop({ required: true, default: 0, min: 0 })
  points: number;
}

export const BumpModel = getModelForClass(Bump, {
  options: {
    customName: "bumps",
  },
});

export type BumpDocument = DocumentType<Bump>;
