import type { DocumentType } from "@typegoose/typegoose";
import { prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

import { mainMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

export class Premium extends TimeStamps {
  @prop({ required: true, unique: true })
  guildId: string;

  @prop({})
  expiresAt: Date;
}

export const PremiumModel = createLazyModel(
  () => mainMongoConnection,
  Premium,
  {
    options: {
      customName: "premium_subscriptions",
    },
    existingConnection: mainMongoConnection!,
  },
);

export type PremiumDocument = DocumentType<Premium>;
