import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { Premium } from "#/shared/db/models/uppy-discord/premium.model.js";
import { PremiumModel } from "#/shared/db/models/uppy-discord/premium.model.js";

import {
  useCachedDelete,
  useCachedQuery,
  useCachedUpdate,
} from "../../mongo.js";
import { redisClient } from "../../redis.js";

@injectable()
export class PremiumRepository {
  private ttl: number = 600_000;

  static create() {
    return new PremiumRepository();
  }

  async findMany(filter: FilterQuery<Premium>) {
    return await PremiumModel.model.find(filter);
  }

  async findByGuildId(guildId: string) {
    return await useCachedQuery(
      this.generateId(guildId),
      this.ttl,
      async () => await PremiumModel.model.findOne({ guildId }),
    );
  }

  async update(guildId: string, update: UpdateQuery<Premium>) {
    return await useCachedUpdate(
      this.generateId(guildId),
      this.ttl,
      async () =>
        await PremiumModel.model.findOneAndUpdate({ guildId }, update, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }),
    );
  }

  async deleteByGuildId(guildId: string) {
    return useCachedDelete(
      this.generateId(guildId),
      async () => await PremiumModel.model.deleteOne({ guildId }),
    );
  }

  async deleteMany(filter: FilterQuery<Premium>) {
    return await PremiumModel.model.deleteMany(filter);
  }

  async cleanUpCache(id: string | string[]) {
    await redisClient.del(
      Array.isArray(id) ? id.map((id) => this.generateId(id)) : id,
    );
  }

  private generateId(guildId: string) {
    return `${guildId}-premium`;
  }
}
