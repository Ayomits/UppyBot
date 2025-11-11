import { DateTime } from "luxon";
import { injectable } from "tsyringe";

import { BumpLogModel, BumpLogSourceType } from "../models/bump-log.model.js";
import { useCachedQuery } from "../mongo.js";

@injectable()
export class BumpLogRepository {
  private ttl = 600_000;

  static create() {
    return new BumpLogRepository();
  }

  async createLog({
    guildId,
    executorId,
    type,
    timestamp = new Date(),
    source = BumpLogSourceType.Discord,
    points = 0,
    messageId = null,
  }: {
    guildId: string;
    executorId: string;
    type: number;
    messageId?: string | null;
    timestamp?: Date;
    source?: number;
    points?: number;
  }) {
    return await useCachedQuery(
      this.generateId(guildId, executorId, timestamp.getTime(), type),
      this.ttl,
      async () =>
        await BumpLogModel.create({
          guildId,
          executorId,
          messageId,
          points,
          type,
          source,
          createdAt: timestamp,
        }),
    );
  }

  async findByTimestamp(
    guildId: string,
    executorId: string,
    timestamp: Date,
    type: number,
  ) {
    const [startPeriod, endPeriod] = [
      DateTime.fromJSDate(timestamp).set({ millisecond: 0 }),
      DateTime.fromJSDate(timestamp).set({ millisecond: 999 }),
    ];

    return await useCachedQuery(
      this.generateId(guildId, executorId, timestamp.getTime(), type),
      this.ttl,
      async () =>
        await BumpLogModel.findOne({
          guildId,
          executorId,
          type,
          createdAt: {
            $gte: startPeriod.toJSDate(),
            $lte: endPeriod.toJSDate(),
          },
        }),
    );
  }

  private generateId(
    guildId: string,
    executorId: string,
    timestamp: number,
    type: number,
  ) {
    return `${guildId}-${executorId}-${timestamp}-${type}-log`;
  }
}
