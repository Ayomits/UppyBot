import { buildSchema, type DocumentType, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";
import type { ColorResolvable } from "discord.js";
import { Colors } from "discord.js";

import {
  baseCommonRemindTemplate,
  baseForceRemindTemplate,
} from "#/discord/libs/templates/index.js";

import { mainMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

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
      bumpBanChannelId: null,
      bumpChannelId: null,
      commandChannelId: null,
      remindChannelId: null,
    },
  })
  channels: {
    pingChannelId: string | null;
    bumpBanChannelId: string | null;
    commandChannelId: string | null;
    remindChannelId: string | null;
    bumpChannelId: string | null;
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

  @prop({ default: { avatar: null, banner: null, color: Colors.Default } })
  theming: {
    avatar: string | null;
    banner: string | null;
    color: ColorResolvable | null;
  };

  @prop({ default: { enabled: false } })
  telegram: {
    enabled: boolean;
  };

  @prop({
    default: {
      common: baseCommonRemindTemplate,
      force: baseForceRemindTemplate,
    },
  })
  templates: {
    common: string;
    force: string;
  };

  @prop({ default: { remindLogs: null, premiumLogs: null, inviteLogs: null } })
  dev: {
    remindLogs: string | null;
    premiumLogs: string | null;
    inviteLogs: string | null;
  };
}

export const SettingsCollectionName = "settings";

export const SettingsModel = createLazyModel(
  () => mainMongoConnection,
  Settings,
  {
    options: {
      customName: SettingsCollectionName,
    },
    existingConnection: mainMongoConnection!,
  },
);

export type SettingsDocument = DocumentType<Settings>;

export const SettingsSchema = buildSchema(Settings);
