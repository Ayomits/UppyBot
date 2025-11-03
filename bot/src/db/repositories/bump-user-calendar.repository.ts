import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { BumpUserCalendar } from "#/db/models/bump-user-calendar.model.js";
import { BumpUserCalendarModel } from "#/db/models/bump-user-calendar.model.js";
import { redisCache } from "../mongo.js";

@injectable()
export class BumpUserCalendarRepository {
  private ttl: number = 600_000;
  static create() {
    return new BumpUserCalendarRepository();
  }

  async findMany(filter: FilterQuery<BumpUserCalendar>) {
    return await BumpUserCalendarModel.find(filter);
  }

  async findManyByGuild(guildId: string) {
    return await BumpUserCalendarModel.find({ guildId }).cache(
      this.ttl,
      this.generateGuildKey(guildId)
    );
  }

  async createOne(doc: BumpUserCalendar) {
    await this.cleanUpCache(doc.guildId as unknown as string);
    return await BumpUserCalendarModel.create(doc);
  }

  async createMany(docs: BumpUserCalendar[]) {
    await this.cleanUpCache(docs.map((d) => d.guildId as unknown as string));
    return await BumpUserCalendarModel.insertMany(docs);
  }

  async updateMany(
    filter: FilterQuery<BumpUserCalendar>,
    update: UpdateQuery<BumpUserCalendar>
  ) {
    return await BumpUserCalendarModel.updateMany(filter, update);
  }

  async deleteMany(filter: FilterQuery<BumpUserCalendar>) {
    return await BumpUserCalendarModel.deleteMany(filter);
  }

  async cleanUpCache(id: string | string[]) {
    if (Array.isArray(id)) {
      return await Promise.all(id.map((x) => redisCache.clear(this.generateGuildKey(x))));
    }
    return await redisCache.clear(this.generateGuildKey(id));
  }

  private generateGuildKey(guildId: string) {
    return `${guildId}-bump-user-calendar`;
  }
}


