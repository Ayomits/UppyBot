import type { LiteralEnum } from "@fear/utils";
import { getModelForClass, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

export const RemindType = {
  DiscordMonitoring: 0,
  ServerMonitoring: 1,
  SdcMonitoring: 2,
} as const;

export type RemindType = LiteralEnum<typeof RemindType>;

export class Remind extends TimeStamps {
  @prop({ alias: "guild_id", required: true })
  guildId: string;

  @prop({ required: true })
  type: number;

  @prop({ required: true })
  timestamp: Date;
}

export const RemindModel = getModelForClass(Remind);
