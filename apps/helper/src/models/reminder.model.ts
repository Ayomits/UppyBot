import { getModelForClass, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

export class Remind extends TimeStamps {
  @prop({ alias: "guild_id", required: true })
  guildId: string;

  @prop({ required: true })
  type: number;

  @prop({ required: true })
  timestamp: Date;
}

export const RemindModel = getModelForClass(Remind);
