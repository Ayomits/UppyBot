import { DateTime } from "luxon";
import { injectable } from "tsyringe";

import { getFieldByRemindType } from "#/discord/app/public/reminder/reminder.const.js";
import { endDateValue,startDateValue } from "#/shared/libs/time/const.js";

import type { BumpUserDocument } from "../models/bump-user.model.js";
import { BumpUserModel } from "../models/bump-user.model.js";
import { useCachedQuery } from "../mongo.js";
import { redisClient } from "../redis.js";

@injectable()
export class BumpUserRepository {
  private ttl = 600_000;

  static create() {
    return new BumpUserRepository();
  }

  async findUser(guildId: string, userId: string, from: Date, to: Date) {
    const now = DateTime.now().set(startDateValue).toMillis();
    const toD = DateTime.fromJSDate(to).set(startDateValue).toMillis();

    if (now > toD) {
      return await useCachedQuery(
        this.generateKey(guildId, userId, from, to),
        this.ttl,
        async () => await this.aggregationFn(guildId, userId, from, to),
      );
    }
    return await this.aggregationFn(guildId, userId, from, to);
  }

  async update(guildId: string, userId: string, points: number, type: number) {
    const start = DateTime.now().set(startDateValue);
    const timestampFilter = {
      $gte: start.toJSDate(),
      $lte: DateTime.now().set(endDateValue).toJSDate(),
    };
    await redisClient.delByPattern(`${guildId}-${userId}-*-*-user-stat`);
    return await BumpUserModel.bulkWrite([
      {
        updateOne: {
          filter: {
            guildId,
            userId: userId,
            timestamp: timestampFilter,
          },
          update: {
            $inc: {
              points: points,
              [getFieldByRemindType(type)!]: 1,
            },
            $setOnInsert: {
              timestamp: start.toJSDate(),
              userId: userId,
              guildId: guildId,
            },
          },
          upsert: true,
        },
      },
    ]);
  }

  private async aggregationFn(
    guildId: string,
    userId: string,
    from: Date,
    to: Date,
  ) {
    return await BumpUserModel.aggregate<Partial<BumpUserDocument>>([
      {
        $match: {
          guildId,
          userId,
          timestamp: {
            $gte: from,
            $lte: to,
          },
        },
      },
      {
        $group: {
          _id: null,
          disboardMonitoring: { $sum: "$disboardMonitoring" },
          dsMonitoring: { $sum: "$dsMonitoring" },
          sdcMonitoring: { $sum: "$sdcMonitoring" },
          serverMonitoring: { $sum: "$serverMonitoring" },
          points: { $sum: "$points" },
          userId: { $first: "$userId" },
        },
      },
      { $limit: 1 },
    ]);
  }

  private generateKey(guildId: string, userId: string, from: Date, to: Date) {
    return `${guildId}-${userId}-${from.getTime()}-${to.getTime()}-user-stat`;
  }
}
