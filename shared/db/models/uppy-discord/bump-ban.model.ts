import {
  type DocumentType,
  getModelForClass,
  prop,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

import { BumpBanLimit } from "#/discord/app/public/reminder/reminder.const.js";

export class BumpBan extends TimeStamps {
  @prop({ required: true })
  guildId: string;

  @prop({ required: true })
  type: number;

  @prop({ required: true })
  userId: string;

  @prop({ required: true, default: 0, min: 0, max: BumpBanLimit })
  removeIn: number;
}

export const BumpBanModel = getModelForClass(BumpBan, {
  options: {
    customName: "bump_bans",
  },
});

export type BumpBanDocument = DocumentType<typeof BumpBanModel>;
