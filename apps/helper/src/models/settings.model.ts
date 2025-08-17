import { getModelForClass, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

export class Settings extends TimeStamps {
  @prop({ alias: "guild_id", required: true, unique: true })
  guildId: string;

  @prop({ alias: "bump_role_ids", default: [] })
  bumpRoleIds?: string[];

  @prop({ alias: "bump_ban_role_id", default: null })
  bumpBanRoleId?: string;

  @prop({ alias: "ping_channel_id", default: null })
  pingChannelId?: string;

  @prop({ alias: "log_channel_id", default: null })
  logChannelId?: string;

  @prop({ min: 0, default: 0 })
  force: number;
}

export const SettingsModel = getModelForClass(Settings, {
  options: {
    customName: "helper_bot_settings",
  },
});
