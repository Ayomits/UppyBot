import {  prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses.js";

import { notificationMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

export class NotificationUser extends TimeStamps {
  @prop({ required: true, unique: true })
  telegram_user_id: number;

  @prop({ required: true })
  discord_user_id: string | null;

  @prop({
    required: true,
    default: {
      ds: false,
      sdc: false,
      server: false,
      disboard: false,
    },
  })
  notifications: {
    ds: boolean;
    sdc: boolean;
    server: boolean;
    disboard: boolean;
  };

  @prop({
    required: true,
    default: { access_token: null, refresh_token: null, expires_at: null },
  })
  tokens: {
    access_token: string | null;
    refresh_token: string | null;
    expires_at: Date | null;
  };

  @prop({
    default: {
      selected_guilds: [],
      allow_force_reminds: false,
    },
  })
  settings: {
    selected_guilds: string[];
    allow_force_reminds: boolean;
  };
}

export const NotificationUserModel = createLazyModel(
  () => notificationMongoConnection,
  NotificationUser,
  {
    options: {
      customName: "users",
    },
    existingConnection: notificationMongoConnection!,
  },
);
