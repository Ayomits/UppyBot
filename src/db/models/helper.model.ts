import { model, Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

import type { UserDocument } from "./base-documents.type.js";

type ForTime = {
  weekly: number;
  alltime: number;
  twoweeks: number;
};

export interface HelperDocument extends UserDocument {
  nextBump: number;
  helperpoints: ForTime;
}

export const HelperModelSchema = new Schema<HelperDocument>({
  guildId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  helperpoints: {
    weekly: {
      type: Number,
      default: 0,
    },
    alltime: {
      type: Number,
      default: 0,
    },
    twoweeks: {
      type: Number,
      default: 0,
    },
  },
  nextBump: {
    type: Number,
    default: 0,
  },
});

export const HelperModel = model<HelperDocument>(
  "guilds_HelperModel",
  HelperModelSchema.plugin(mongoosePaginate),
);
