import { prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

import { mainMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

export class BumpFire extends TimeStamps {
  @prop({ required: true, unique: true })
  userId: string;

  @prop({ required: true })
  streak: number;
}

export const BumpFireModel = createLazyModel(
  () => mainMongoConnection,
  BumpFire,
  {
    options: {
      customName: "bump_fires",
    },
  }
);
