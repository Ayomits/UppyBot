import { prop } from "@typegoose/typegoose";

import { notificationMongoConnection } from "../../mongo.js";
import { createLazyModel } from "../../utils/create-lazy-model.js";

export class NotificationUserToken {
  @prop({
    required: true,
    expires: 600_000,
  })
  expired_at: Date;

  @prop({ required: true })
  telegram_user_id: number;
}

export const NotificationUserTokenModel = createLazyModel(
  () => notificationMongoConnection,
  NotificationUserToken,
  {
    options: {
      customName: "tokens",
    },
    existingConnection: notificationMongoConnection!,
  }
);
