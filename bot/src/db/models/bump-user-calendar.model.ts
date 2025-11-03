import {
  buildSchema,
  type DocumentType,
  getModelForClass,
  index,
  prop,
} from "@typegoose/typegoose";
import type { Snowflake } from "discord.js";

@index({ guildId: 1, userId: 1 })
export class BumpUserCalendar {
  @prop({ required: true })
  guildId: Snowflake;

  @prop({ required: true })
  userId: Snowflake;

  @prop({ required: true })
  formatted: string;

  @prop({ required: true, default: Date.now() })
  timestamp: Date;
}

export const BumpUserCalendarSchema = buildSchema(BumpUserCalendar);

export const BumpUserCalendarCollectionName = "bump_user_calendar";

export const BumpUserCalendarModel = getModelForClass(BumpUserCalendar, {
  options: { customName: BumpUserCalendarCollectionName },
});

export type BumpUserCalendarDocument = DocumentType<BumpUserCalendar>;
