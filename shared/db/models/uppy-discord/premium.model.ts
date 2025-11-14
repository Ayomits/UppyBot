import type { DocumentType } from "@typegoose/typegoose";
import { prop } from "@typegoose/typegoose";

import { mainMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

export class Premium {
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
