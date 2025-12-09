import type { DocumentType } from "@typegoose/typegoose";
import { index, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

import { mainMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
export class Promocode extends TimeStamps {
  @prop({ required: true })
  code: string;

  @prop({ required: true, default: 0 })
  durationMs: number;

  @prop({ required: true, default: 1 })
  activations: number;

  @prop({ required: true, default: [] })
  entries: string[];

  @prop({})
  expiresAt: Date;
}

export const PromocodeModel = createLazyModel(
  () => mainMongoConnection,
  Promocode,
  {
    options: {
      customName: "promocodes",
    },
    existingConnection: mainMongoConnection!,
  }
);

export type PromocodeDocument = DocumentType<Promocode>;
