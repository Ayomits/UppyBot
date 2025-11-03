import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { Settings } from "#/db/models/settings.model.js";
import { SettingsModel } from "#/db/models/settings.model.js";

import { redisCache } from "../mongo.js";

@injectable()
export class SettingsRepository {
  async findMany(filter: FilterQuery<Settings>) {
    return await SettingsModel.find(filter);
  }

  async findGuildSettings(guildId: string) {
    return await SettingsModel.findOneAndUpdate(
      { guildId },
      {},
      { upsert: true, setDefaultsOnInsert: true, new: true }
    ).cache(600_000, this.generateId(guildId));
  }

  async update(guildId: string, payload: UpdateQuery<Settings>) {
    await redisCache.clear(this.generateId(guildId));
    return await SettingsModel.findOneAndUpdate({ guildId }, payload, {
      upsert: true,
      setDefaultsOnInsert: true,
      new: true,
    });
  }

  private generateId(guildId: string) {
    return `${guildId}-settings`;
  }
}
