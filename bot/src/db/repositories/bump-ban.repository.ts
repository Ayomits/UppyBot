import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { BumpBan } from "#/db/models/bump-ban.model.js";
import { BumpBanModel } from "#/db/models/bump-ban.model.js";

import { redisCache } from "../mongo.js";

@injectable()
export class BumpBanRepository {
  private ttl: number = 600_000;
  static create() {
    return new BumpBanRepository();
  }

  async findMany(filter: FilterQuery<BumpBan>) {
    return await BumpBanModel.find(filter);
  }

  async findOne(filter: FilterQuery<BumpBan>) {
    return await BumpBanModel.findOne(filter);
  }

  async findManyByGuild(guildId: string) {
    return await BumpBanModel.find({ guildId }).cache(
      this.ttl,
      this.generateGuildKey(guildId)
    );
  }

  async createOne(doc: BumpBan) {
    await this.cleanUpCache(doc.guildId);
    return await BumpBanModel.create(doc);
  }

  async createMany(docs: BumpBan[]) {
    await this.cleanUpCache(docs.map((d) => d.guildId));
    return await BumpBanModel.insertMany(docs);
  }

  async updateMany(filter: FilterQuery<BumpBan>, update: UpdateQuery<BumpBan>) {
    return await BumpBanModel.updateMany(filter, update);
  }

  async deleteMany(filter: FilterQuery<BumpBan>) {
    return await BumpBanModel.deleteMany(filter);
  }

  async cleanUpCache(id: string | string[]) {
    if (Array.isArray(id)) {
      return await Promise.all(id.map((x) => redisCache.clear(this.generateGuildKey(x))));
    }
    return await redisCache.clear(this.generateGuildKey(id));
  }

  private generateGuildKey(guildId: string) {
    return `${guildId}-bump-ban`;
  }
}


