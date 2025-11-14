import { getModelForClass, prop } from "@typegoose/typegoose";
import { DateTime } from "luxon";

export class NotificationUserToken {
  @prop({
    required: true,
    default: DateTime.now().plus({ minutes: 10 }),
    expires: 600_000,
  })
  expired_at: Date;

  @prop({ required: true })
  telegram_user_id: number;
}

export const NotificationUserTokenModel = getModelForClass(
  NotificationUserToken,
  {
    options: {
      customName: "tokens",
    },
  }
);
