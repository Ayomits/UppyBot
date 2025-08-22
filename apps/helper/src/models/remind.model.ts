import {
  type DocumentType,
  getModelForClass,
  prop,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

export class Remind extends TimeStamps {
  @prop({ alias: "guild_id", required: true, index: true })
  guildId: string;

  @prop({ required: true, index: true })
  type: number;

  @prop({ required: true })
  timestamp: Date;
}

export const RemindModel = getModelForClass(Remind, {
  options: {
    customName: "bump_reminds",
  },
});

export type RemindDocument = DocumentType<Remind>;

export interface StaffInfoAgregation {
  points: number;
  bump: number;
  like: number;
  up: number;
}
