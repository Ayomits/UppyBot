import type { UpdateQuery } from "mongoose";

import type { NotificationUser } from "../../models/uppy-telegram/user.model.js";
import { NotificationUserModel } from "../../models/uppy-telegram/user.model.js";

export class NotificationUserRepository {
  static create() {
    return new NotificationUserRepository();
  }

  async createUser(
    payload: Partial<NotificationUser> &
      Pick<NotificationUser, "discord_user_id" | "telegram_user_id">
  ) {
    return await NotificationUserModel.findOneAndUpdate(
      {
        $or: [
          { discord_user_id: payload.discord_user_id },
          { telegram_user_id: payload.telegram_user_id },
        ],
      },
      payload,
      {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true,
      }
    );
  }

  async findByDiscordId(dsId: string) {
    return await NotificationUserModel.findOne({ discord_user_id: dsId });
  }

  async findByTgId(tgId: number) {
    return await NotificationUserModel.findOne({ telegram_user_id: tgId });
  }

  async updateByDiscordId(dsId: string, update: UpdateQuery<NotificationUser>) {
    return await NotificationUserModel.findOneAndUpdate(
      { discord_user_id: dsId },
      update,
      { upsert: true, setDefaultsOnInsert: true, new: true }
    );
  }

  async updateByTgId(tgId: number, update: UpdateQuery<NotificationUser>) {
    return await NotificationUserModel.findOneAndUpdate(
      { telegram_user_id: tgId },
      update,
      { upsert: true, setDefaultsOnInsert: true, new: true }
    );
  }
}
