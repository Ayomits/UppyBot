import { getModelForClass, prop } from "@typegoose/typegoose";

import type { RemindType } from "#/apps/uppy/controllers/reminder/reminder.const.js";

export class RemindLogs {
  @prop({ required: true, index: true })
  guildId: string;

  @prop({ required: true })
  type: RemindType;

  @prop({ required: true })
  timestamp: Date;

  @prop({ required: true })
  isForce: boolean;

  @prop({ required: true, default: Date.now() })
  createdAt: Date;
}

export const RemindLogsModel = getModelForClass(RemindLogs, {
  options: {
    customName: "bump_remind_logs",
  },
});
