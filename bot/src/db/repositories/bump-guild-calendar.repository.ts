import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { BumpGuildCalendar } from "#/db/models/bump-guild-calendar.model.js";
import { BumpGuildCalendarModel } from "#/db/models/bump-guild-calendar.model.js";

import { redisCache } from "../mongo.js";

@injectable()
export class BumpGuildCalendarRepository {
  private ttl: number = 600_000;
  static create() {
    return new BumpGuildCalendarRepository();
  }

  async findMany(filter: FilterQuery<BumpGuildCalendar>) {
    return await BumpGuildCalendarModel.find(filter);
  }

  async findManyByGuild(guildId: string) {
    return await BumpGuildCalendarModel.find({ guildId }).cache(
      this.ttl,
      this.generateGuildKey(guildId)
    );
  }

  async createOne(doc: BumpGuildCalendar) {
    await this.cleanUpCache(doc.guildId as unknown as string);
    return await BumpGuildCalendarModel.create(doc);
  }

  async createMany(docs: BumpGuildCalendar[]) {
    await this.cleanUpCache(docs.map((d) => d.guildId as unknown as string));
    return await BumpGuildCalendarModel.insertMany(docs);
  }

  async updateMany(
    filter: FilterQuery<BumpGuildCalendar>,
    update: UpdateQuery<BumpGuildCalendar>
  ) {
    return await BumpGuildCalendarModel.updateMany(filter, update);
  }

  async deleteMany(filter: FilterQuery<BumpGuildCalendar>) {
    return await BumpGuildCalendarModel.deleteMany(filter);
  }

  async cleanUpCache(id: string | string[]) {
    if (Array.isArray(id)) {
      return await Promise.all(id.map((x) => redisCache.clear(this.generateGuildKey(x))));
    }
    return await redisCache.clear(this.generateGuildKey(id));
  }

  private generateGuildKey(guildId: string) {
    return `${guildId}-bump-guild-calendar`;
  }
}


