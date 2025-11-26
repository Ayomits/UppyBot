import { type DocumentType, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

import { BumpBanLimit } from "#/discord/app/public/reminder/reminder.const.js";

import { mainMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

export class BumpBan extends TimeStamps {
  @prop({ required: true })
  guildId: string;

  @prop({ required: true })
  type: number;

  @prop({ required: true })
  userId: string;

  @prop({ required: true, default: 0, min: 0, max: BumpBanLimit })
  counter: number;
}

export const BumpBanCollectionName = "bump_bans";

export const BumpBanModel = createLazyModel(
  () => mainMongoConnection,
  BumpBan,
  {
    options: {
      customName: BumpBanCollectionName,
    },
  }
);

export type BumpBanDocument = DocumentType<typeof BumpBanModel>;
