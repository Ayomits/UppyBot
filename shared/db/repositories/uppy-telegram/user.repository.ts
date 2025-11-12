import type { UpdateQuery } from "mongoose";

import type { NotificationUser } from "../../models/uppy-telegram/user.model.js";
import { NotificationUserModel } from "../../models/uppy-telegram/user.model.js";
import { useCachedQuery, useCachedUpdate } from "../../mongo.js";

export class NotificationUserRepository {
  private ttl = 600_000;

  static create() {
    return new NotificationUserRepository();
  }

  async createUser(
    payload: Partial<NotificationUser> &
      Pick<NotificationUser, "discord_user_id" | "telegram_user_id">
  ) {
    return await useCachedQuery(
      this.generateId(payload.discord_user_id),
      this.ttl,
      async () =>
        await NotificationUserModel.findOneAndUpdate(
          { telegram_user_id: payload.telegram_user_id },
          payload,
          {
            upsert: true,
            setDefaultsOnInsert: true,
            new: true,
          }
        )
    );
  }

  async findByDiscordId(dsId: string) {
    return await useCachedQuery(
      this.generateId(dsId),
      this.ttl,
      async () => await NotificationUserModel.findOne({ discord_user_id: dsId })
    );
  }

  async updateByDiscordId(dsId: string, update: UpdateQuery<NotificationUser>) {
    return await useCachedUpdate(
      this.generateId(dsId),
      this.ttl,
      async () =>
        await NotificationUserModel.findOneAndUpdate(
          { discord_user_id: dsId },
          update,
          { upsert: true, setDefaultsOnInsert: true, new: true }
        )
    );
  }

  private generateId(dsId: string) {
    return `${dsId}-notification-user`;
  }
}
