import {
  buildSchema,
  getModelForClass,
  modelOptions,
  prop,
  Severity,
} from "@typegoose/typegoose";

import type { LiteralEnum } from "#/libs/utils/types.js";

export const RemindType = {
  Force: 0,
  Common: 1,
} as const;

export type RemindType = LiteralEnum<typeof RemindType>;

export const RemindLogState = {
  Created: 0,
  Canceled: 1,
  Sended: 2,
} as const;

export type RemindLogState = LiteralEnum<typeof RemindLogState>;

@modelOptions({
  options: {
    allowMixed: Severity.WARN,
  },
})
export class RemindLog {
  @prop({ required: true, index: true })
  guildId: string;

  @prop({ required: true })
  monitoring: number;

  @prop({ required: true })
  timestamp: Date;

  @prop({ required: true, default: RemindLogState.Created })
  state: number;

  @prop({ required: true })
  type: number;

  @prop({ required: true, default: Date.now() })
  createdAt: Date;
}

export const RemindLogsCollectionName = "bump_remind_logs";

export const RemindLogsSchema = buildSchema(RemindLog);

export const RemindLogsModel = getModelForClass(RemindLog, {
  options: {
    customName: RemindLogsCollectionName,
  },
});
