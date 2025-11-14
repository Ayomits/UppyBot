import {
  buildSchema,
  type DocumentType,
  index,
  prop,
} from "@typegoose/typegoose";
import type { Snowflake } from "discord.js";

import { mainMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

@index({ guildId: 1, userId: 1 })
export class BumpGuildCalendar {
  @prop({ required: true, index: true })
  guildId: Snowflake;

  @prop({ required: true })
  formatted: string;

  @prop({ required: true, default: Date.now() })
  timestamp: Date;
}

export const BumpGuildCalendarSchema = buildSchema(BumpGuildCalendar);

export const BumpGuildCalendarCollectionName = "bump_guild_calendar";

export const BumpGuildCalendarModel = createLazyModel(
  () => mainMongoConnection,
  BumpGuildCalendar,
  {
    options: { customName: BumpGuildCalendarCollectionName },
  },
);

export type BumpGuildCalendarDocument = DocumentType<BumpGuildCalendar>;
