import type { DocumentType } from "@typegoose/typegoose";
import { getModelForClass, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

import {
  PointsRate,
  type RemindType,
} from "#/modules/reminder/reminder.const.js";

export class PointSettings extends TimeStamps {
  @prop({ required: true, index: true })
  guildId: string;

  @prop({ required: true })
  type: RemindType;

  @prop({ default: 0, required: true })
  default: number;

  // night time bonus
  @prop({ default: 0, required: true })
  bonus: number;
}

export const PointSettingsModel = getModelForClass(PointSettings, {
  options: {
    customName: "point_settings",
  },
});

export type PointSettingsDocument = DocumentType<PointSettings>;

export async function safePointConfig(guildId: string, type: number) {
  let entry = await PointSettingsModel.findOne({ guildId, type });

  if (!entry) {
    entry = await PointSettingsModel.create({
      guildId,
      type,
      bonus: PointsRate.night,
      default: PointsRate[type],
    });
  }
  return entry;
}
