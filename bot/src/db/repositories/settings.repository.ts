import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { Settings } from "#/db/models/settings.model.js";
import { SettingsModel } from "#/db/models/settings.model.js";

import { useCachedQuery, useCachedUpdate } from "../mongo.js";

@injectable()
export class SettingsRepository {
  private ttl = 600_000;
  static create() {
    return new SettingsRepository();
  }

  async findMany(filter: FilterQuery<Settings>) {
    return await SettingsModel.find(filter);
  }

  async findGuildSettings(guildId: string) {
    return await useCachedQuery(
      this.generateId(guildId),
      this.ttl,
      async () =>
        await SettingsModel.findOneAndUpdate(
          { guildId },
          {},
          { upsert: true, setDefaultsOnInsert: true, new: true }
        )
    );
  }

  async update(guildId: string, payload: UpdateQuery<Settings>) {
    return await useCachedUpdate(
      this.generateId(guildId),
      this.ttl,
      async () =>
        await SettingsModel.findOneAndUpdate({ guildId }, payload, {
          upsert: true,
          setDefaultsOnInsert: true,
          new: true,
        })
    );
  }

  private generateId(guildId: string) {
    return `${guildId}-settings`;
  }
}
