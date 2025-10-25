import {
  type DocumentType,
  getModelForClass,
  prop,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

export class Settings extends TimeStamps {
  @prop({ alias: "guild_id", required: true, index: true, unique: true })
  guildId: string;

  @prop({
    default: {
      pingRoles: [],
      managerRoles: [],
      bumpBanRoleId: null,
    },
  })
  roles: {
    pingRoles?: string[];
    managerRoles: string[];
    bumpBanRoleId?: string;
  };

  @prop({
    default: {
      pingChannelId: null,
      actionLogChannelId: null,
    },
  })
  channels: {
    pingChannelId: string | null;
    actionLogChannelId: string | null;
  };

  @prop({ default: { useForceOnly: false, force: 0 } })
  remind: {
    enabled: boolean;
    useForceOnly: boolean;
    force: number;
  };

  @prop({ default: { enabled: false } })
  kd: {
    enabled: boolean;
  };
}

export const SettingsCollectionName = "settings";

export const SettingsModel = getModelForClass(Settings, {
  options: {
    customName: SettingsCollectionName,
  },
});

export type SettingsDocument = DocumentType<Settings>;
