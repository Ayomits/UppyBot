import {
  type DocumentType,
  prop,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

import { mainMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

export class Remind extends TimeStamps {
  @prop({ alias: "guild_id", required: true, index: true })
  guildId: string;

  @prop({ required: true, index: true })
  type: number;

  @prop({ required: true })
  timestamp: Date;
}

export const RemindModel = createLazyModel(() => mainMongoConnection, Remind, {
  options: {
    customName: "bump_reminds",
  },
  existingConnection: mainMongoConnection!,
});

export type RemindDocument = DocumentType<Remind>;
