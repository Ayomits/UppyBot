import type { FilterQuery, UpdateQuery } from "mongoose";

import { MonitoringType } from "#/discord/app/public/reminder/reminder.const.js";

import type { NotificationUser } from "../../models/uppy-telegram/user.model.js";
import { NotificationUserModel } from "../../models/uppy-telegram/user.model.js";

export class NotificationUserRepository {
  static create() {
    return new NotificationUserRepository();
  }

  async find(filter: FilterQuery<NotificationUser>) {
    return await NotificationUserModel.model.find(filter);
  }

  async createUser(
    payload: Partial<NotificationUser> &
      Pick<NotificationUser, "discord_user_id" | "telegram_user_id">,
  ) {
    return await NotificationUserModel.model.findOneAndUpdate(
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
      },
    );
  }

  async findByDiscordId(dsId: string) {
    return await NotificationUserModel.model.findOne({ discord_user_id: dsId });
  }

  async findByTgId(tgId: number) {
    return await NotificationUserModel.model.findOne({
      telegram_user_id: tgId,
    });
  }

  async updateByDiscordId(dsId: string, update: UpdateQuery<NotificationUser>) {
    return await NotificationUserModel.model.findOneAndUpdate(
      { discord_user_id: dsId },
      update,
      { upsert: true, setDefaultsOnInsert: true, new: true },
    );
  }

  async updateByTgId(tgId: number, update: UpdateQuery<NotificationUser>) {
    return await NotificationUserModel.model.findOneAndUpdate(
      { telegram_user_id: tgId },
      update,
      { upsert: true, setDefaultsOnInsert: true, new: true },
    );
  }

  getNotificationFieldByMonitoring(
    type: number,
  ): keyof NotificationUser["notifications"] | undefined {
    switch (type) {
      case MonitoringType.SdcMonitoring:
        return "sdc";
      case MonitoringType.DisboardMonitoring:
        return "disboard";
      case MonitoringType.ServerMonitoring:
        return "server";
      case MonitoringType.DiscordMonitoring:
        return "ds";
    }
  }
}
