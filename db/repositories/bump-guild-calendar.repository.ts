import { DateTime } from "luxon";
import type { FilterQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { BumpGuildCalendar } from "#/db/models/bump-guild-calendar.model.js";
import { BumpGuildCalendarModel } from "#/db/models/bump-guild-calendar.model.js";
import { endDateValue, startDateValue } from "#/libs/time/const.js";

import { useCachedQuery } from "../mongo.js";
import { redisClient } from "../redis.js";

@injectable()
export class BumpGuildCalendarRepository {
  private ttl: number = 600_000;
  static create() {
    return new BumpGuildCalendarRepository();
  }

  async findCalendar(guildId: string, filter?: FilterQuery<BumpGuildCalendar>) {
    return await useCachedQuery(
      this.generateId(guildId),
      this.ttl,
      async () =>
        await BumpGuildCalendarModel.find({
          guildId,
          ...filter,
        })
          .sort({ timestamp: -1 })
          .limit(25),
    );
  }

  async pushToCalendar(guildId: string) {
    const start = DateTime.now().set(startDateValue);
    const end = DateTime.now().set(endDateValue);

    const timestampFilter = {
      $gte: start.toJSDate(),
      $lte: end.toJSDate(),
    };

    await Promise.all([
      BumpGuildCalendarModel.findOneAndUpdate(
        {
          guildId,
          timestamp: timestampFilter,
        },
        {
          $setOnInsert: {
            timestamp: start.toJSDate(),
            formatted: start.toFormat("d.MM.yy"),
            guildId,
          },
        },
        {
          upsert: true,
          setDefaultsOnInsert: true,
          new: true,
        },
      ),
      redisClient.del(this.generateId(guildId)),
    ]);
  }

  private generateId(guildId: string) {
    return `${guildId}-bump-guild-calendar`;
  }
}
