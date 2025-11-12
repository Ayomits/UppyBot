import {
  buildSchema,
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
      staffRoles: [],
    },
  })
  roles: {
    pingRoles?: string[];
    staffRoles?: string[];
    managerRoles: string[];
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

  @prop({ default: { enabled: true } })
  remind: {
    enabled: boolean;
  };

  @prop({
    default: {
      enabled: false,
      dsMonitoring: 0,
      disboard: 0,
      sdc: 0,
      server: 5,
    },
  })
  kd: {
    enabled: boolean;
    dsMonitoring: number;
    disboard: number;
    sdc: number;
    server: number;
  };

  @prop({
    default: {
      enabled: false,
      dsMonitoring: {
        default: 1,
        bonus: 1,
      },
      disboard: {
        default: 1,
        bonus: 1,
      },
      sdc: {
        default: 1,
        bonus: 1,
      },
      server: {
        default: 1,
        bonus: 1,
      },
    },
  })
  points: {
    enabled: boolean;
    dsMonitoring: {
      default: number;
      bonus: number;
    };
    disboard: {
      default: number;
      bonus: number;
    };
    sdc: {
      default: number;
      bonus: number;
    };
    server: {
      default: number;
      bonus: number;
    };
  };

  @prop({ default: { enabled: false, roleId: null } })
  bumpBan: {
    enabled: boolean;
    roleId: string;
  };

  @prop({ default: { useForceOnly: false, seconds: 0 } })
  force: {
    enabled: boolean;
    useForceOnly: boolean;
    seconds: number;
  };

  @prop({ default: { url: null, token: null } })
  webhooks: {
    url: string | null;
    token: string | null;
  };
}

export const SettingsCollectionName = "settings";

export const SettingsModel = getModelForClass(Settings, {
  options: {
    customName: SettingsCollectionName,
  },
});

export type SettingsDocument = DocumentType<Settings>;

export const SettingsSchema = buildSchema(Settings);
