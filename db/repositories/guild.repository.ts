import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { Guild } from "#/db/models/guild.model.js";
import { GuildModel } from "#/db/models/guild.model.js";

import { useCachedQuery, useCachedUpdate } from "../mongo.js";
import { redisClient } from "../redis.js";

@injectable()
export class GuildRepository {
  constructor() {}

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
    return await useCachedQuery(
      this.generateId(guildId),
      this.ttl,
      async () =>
        await GuildModel.findOneAndUpdate(
          { guildId },
          {},
          { upsert: true, setDefaultsOnInsert: true, new: true },
        ),
    );
  }

  async update(guildId: string, update: UpdateQuery<Guild>) {
    return await useCachedUpdate(
      this.generateId(guildId),
      this.ttl,
      async () =>
        await GuildModel.findOneAndUpdate({ guildId }, update, {
          upsert: true,
          setDefaultsOnInsert: true,
          new: true,
        }),
    );
  }

  async updateMany(filter: FilterQuery<Guild>, update: UpdateQuery<Guild>) {
    return await GuildModel.updateMany(filter, update);
  }

  async cleanUpCache(id: string | string[]) {
    await redisClient.del(
      Array.isArray(id) ? id.map((id) => this.generateId(id)) : id,
    );
  }

  private generateId(guildId: string) {
    return `${guildId}-guild`;
  }
}
