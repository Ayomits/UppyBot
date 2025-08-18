import {
  type DocumentType,
  getModelForClass,
  modelOptions,
  prop,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

@modelOptions({})
export class Remind extends TimeStamps {
  @prop({ alias: "guild_id", required: true, index: true })
  guildId: string;

  @prop({ required: true })
  type: number;

  @prop({ required: true })
  timestamp: Date;
}

export const RemindModel = getModelForClass(Remind);

export type RemindDocument = DocumentType<Remind>;
