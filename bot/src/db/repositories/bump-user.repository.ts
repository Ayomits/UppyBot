import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { BumpUser } from "#/db/models/bump-user.model.js";
import { BumpUserModel } from "#/db/models/bump-user.model.js";
import { redisCache } from "../mongo.js";

@injectable()
export class BumpUserRepository {
  private ttl: number = 600_000;
  static create() {
    return new BumpUserRepository();
  }

  async findMany(filter: FilterQuery<BumpUser>) {
    return await BumpUserModel.find(filter);
  }

  async findOne(filter: FilterQuery<BumpUser>) {
    return await BumpUserModel.findOne(filter);
  }

  async findManyByGuild(guildId: string) {
    return await BumpUserModel.find({ guildId }).cache(
      this.ttl,
      this.generateGuildKey(guildId)
    );
  }

  async createOne(doc: BumpUser) {
    await this.cleanUpCache(doc.guildId as unknown as string);
    return await BumpUserModel.create(doc);
  }

  async createMany(docs: BumpUser[]) {
    await this.cleanUpCache(docs.map((d) => d.guildId as unknown as string));
    return await BumpUserModel.insertMany(docs);
  }

  async updateMany(filter: FilterQuery<BumpUser>, update: UpdateQuery<BumpUser>) {
    return await BumpUserModel.updateMany(filter, update);
  }

  async deleteMany(filter: FilterQuery<BumpUser>) {
    return await BumpUserModel.deleteMany(filter);
  }

  async cleanUpCache(id: string | string[]) {
    if (Array.isArray(id)) {
      return await Promise.all(id.map((x) => redisCache.clear(this.generateGuildKey(x))));
    }
    return await redisCache.clear(this.generateGuildKey(id));
  }

  private generateGuildKey(guildId: string) {
    return `${guildId}-bump-user`;
  }
}


