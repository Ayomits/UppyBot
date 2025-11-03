import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { Guild } from "#/db/models/guild.model.js";
import { GuildModel } from "#/db/models/guild.model.js";

import { redisCache } from "../mongo.js";

@injectable()
export class GuildRepository {
  private ttl: number = 600_000;

  static create() {
    return new GuildRepository();
  }

  async findMany(filter: FilterQuery<Guild>) {
    return await GuildModel.find(filter);
  }

  async createMany(docs: Guild[]) {
    return await GuildModel.insertMany(docs);
  }

  async findGuild(guildId: string) {
    return await GuildModel.findOneAndUpdate(
      { guildId },
      {},
      { upsert: true, setDefaultsOnInsert: true, new: true }
    ).cache(this.ttl, this.generateId(guildId));
  }

  async update(guildId: string, update: UpdateQuery<Guild>) {
    return await GuildModel.findOneAndUpdate({ guildId }, update, {
      upsert: true,
      setDefaultsOnInsert: true,
      new: true,
    }).cache(this.ttl, this.generateId(guildId));
  }

  async updateMany(filter: FilterQuery<Guild>, update: UpdateQuery<Guild>) {
    return await GuildModel.updateMany(filter, update);
  }

  async cleanUpCache(id: string | string[]) {
    if (Array.isArray(id)) {
      return await Promise.all(
        id.map((id) => redisCache.clear(this.generateId(id)))
      );
    }
    return await redisCache.clear(this.generateId(id));
  }

  private generateId(guildId: string) {
    return `${guildId}-guild`;
  }
}
