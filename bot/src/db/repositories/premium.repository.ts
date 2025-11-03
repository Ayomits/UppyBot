import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { Premium } from "#/db/models/premium.model.js";
import { PremiumModel } from "#/db/models/premium.model.js";

import { redisCache } from "../mongo.js";

@injectable()
export class PremiumRepository {
  private ttl: number = 600_000;

  static create() {
    return new PremiumRepository();
  }

  async findMany(filter: FilterQuery<Premium>) {
    return await PremiumModel.find(filter);
  }

  async findByGuildId(guildId: string) {
    return await PremiumModel.findOne({ guildId }).cache(
      this.ttl,
      this.generateId(guildId)
    );
  }

  async upsert(guildId: string, update: UpdateQuery<Premium>) {
    await this.cleanUpCache(guildId);
    return await PremiumModel.findOneAndUpdate({ guildId }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }).cache(this.ttl, this.generateId(guildId));
  }

  async deleteByGuildId(guildId: string) {
    await this.cleanUpCache(guildId);
    return await PremiumModel.deleteOne({ guildId });
  }

  async deleteMany(filter: FilterQuery<Premium>) {
    return await PremiumModel.deleteMany(filter);
  }

  async cleanUpCache(id: string | string[]) {
    if (Array.isArray(id)) {
      return await Promise.all(id.map((x) => redisCache.clear(this.generateId(x))));
    }
    return await redisCache.clear(this.generateId(id));
  }

  private generateId(guildId: string) {
    return `${guildId}-premium`;
  }
}