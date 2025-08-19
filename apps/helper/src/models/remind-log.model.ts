import {
  type DocumentType,
  getModelForClass,
  prop,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

export class RemindLog extends TimeStamps {
  @prop({ alias: "guild_id", required: true, index: true })
  guildId: string;

  @prop({ required: true, index: true })
  type: number;

  @prop({ required: true, alias: "sended_at" })
  sendedAt: Date;
}

export const RemindModel = getModelForClass(RemindLog, {
  options: {
    customName: "bump_remind_logs",
  },
});

export type RemindDocument = DocumentType<RemindLog>;
