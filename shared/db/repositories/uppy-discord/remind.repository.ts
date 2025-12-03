import type { FilterQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { Remind } from "../../models/uppy-discord/remind.model.js";
import { RemindModel } from "../../models/uppy-discord/remind.model.js";
import { useCachedQuery, useCachedUpdate } from "../../mongo.js";

@injectable()
export class RemindRepository {
  private ttl: number = 600;
  static create() {
    return new RemindRepository();
  }

  async findMany(filter: FilterQuery<Remind>) {
    return await RemindModel.model.find(filter);
  }

  async findRemind(guildId: string, type: number) {
    return await useCachedQuery(
      this.generateId(guildId, type),
      this.ttl,
      async () => await RemindModel.model.findOne({ guildId, type }),
    );
  }

  async findOrCreate(guildId: string, type: number, timestamp: Date) {
    return await useCachedUpdate(
      this.generateId(guildId, type),
      this.ttl,
      async () =>
        await RemindModel.model.findOneAndUpdate(
          { guildId, type },
          { timestamp },
          { upsert: true, new: true },
        ),
    );
  }

  private generateId(guildId: string, type: number) {
    return `${guildId}-${type}-remind`;
  }
}
