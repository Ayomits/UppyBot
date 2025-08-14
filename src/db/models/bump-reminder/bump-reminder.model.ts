import type { Snowflake } from "discord.js";
import { model, Schema } from "mongoose";

import type { BaseModuleGuildDocument } from "../base/index.js";

export type MonitoringType = {
  last: Date | null;
  next: Date | null;
  warning?: Date | null;
};

export interface BumpReminderModuleDocument extends BaseModuleGuildDocument {
  helperRoleID: Snowflake[];
  pingChannelId: Snowflake;
  bumpbanRole: Snowflake[];
  sdcMonitoring: MonitoringType;
  discordMonitoring: MonitoringType;
  serverMonitoring: MonitoringType;
}

const MonitoringSchema = new Schema<MonitoringType>({
  last: { type: Date, default: null },
  next: { type: Date, default: null },
  warning: { type: Date, default: null },
});

export const BumpReminderModuleSchema = new Schema<BumpReminderModuleDocument>({
  guildId: { type: String, required: true },
  helperRoleID: { type: [String], default: [] },
  bumpbanRole: { type: [String], default: [] },
  pingChannelId: { type: String, default: null },
  enable: { type: Boolean, default: false },
  sdcMonitoring: { type: MonitoringSchema, default: () => ({}) },
  discordMonitoring: { type: MonitoringSchema, default: () => ({}) },
  serverMonitoring: { type: MonitoringSchema, default: () => ({}) },
});

export const BumpReminderModuleModel = model<BumpReminderModuleDocument>(
  "guild_bumpreminder",
  BumpReminderModuleSchema,
);
