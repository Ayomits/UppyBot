import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { Remind } from "#/db/models/remind.model.js";
import { RemindModel } from "#/db/models/remind.model.js";
import { redisCache } from "../mongo.js";

@injectable()
export class RemindRepository {
  private ttl: number = 600_000;
  static create() {
    return new RemindRepository();
  }

  async findMany(filter: FilterQuery<Remind>) {
    return await RemindModel.find(filter);
  }

  async findOne(filter: FilterQuery<Remind>) {
    return await RemindModel.findOne(filter);
  }

  async findManyByGuild(guildId: string) {
    return await RemindModel.find({ guildId }).cache(
      this.ttl,
      this.generateGuildKey(guildId)
    );
  }

  async createOne(doc: Remind) {
    await this.cleanUpCache(doc.guildId);
    return await RemindModel.create(doc);
  }

  async createMany(docs: Remind[]) {
    await this.cleanUpCache(docs.map((d) => d.guildId));
    return await RemindModel.insertMany(docs);
  }

  async updateMany(filter: FilterQuery<Remind>, update: UpdateQuery<Remind>) {
    return await RemindModel.updateMany(filter, update);
  }

  async deleteMany(filter: FilterQuery<Remind>) {
    return await RemindModel.deleteMany(filter);
  }

  async cleanUpCache(id: string | string[]) {
    if (Array.isArray(id)) {
      return await Promise.all(id.map((x) => redisCache.clear(this.generateGuildKey(x))));
    }
    return await redisCache.clear(this.generateGuildKey(id));
  }

  private generateGuildKey(guildId: string) {
    return `${guildId}-remind`;
  }
}


