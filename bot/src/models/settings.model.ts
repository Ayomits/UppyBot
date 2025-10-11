import {
  type DocumentType,
  getModelForClass,
  prop,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

export class UppySettings extends TimeStamps {
  @prop({ alias: "guild_id", required: true, index: true, unique: true })
  guildId: string;

  @prop({ alias: "bump_role_ids", default: [] })
  bumpRoleIds?: string[];

  @prop({ default: [] })
  managerRoles: string[];

  @prop({ default: null })
  bumpBanRoleId?: string;

  @prop({ default: null })
  pingChannelId?: string;

  @prop({ default: null })
  actionLogChannelId?: string;

  @prop({ default: false })
  useForceOnly: boolean;

  @prop({ min: 0, default: 0 })
  force: number;
}

export const UppySettingsCollectionName = "helper_bot_settings";

export const UppySettingsModel = getModelForClass(UppySettings, {
  options: {
    customName: "helper_bot_settings",
  },
});

export type UppySettingsDocument = DocumentType<UppySettings>;
