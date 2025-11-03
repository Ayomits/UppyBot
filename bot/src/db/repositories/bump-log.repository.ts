import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { BumpLog } from "#/db/models/bump-log.model.js";
import { BumpLogModel } from "#/db/models/bump-log.model.js";

@injectable()
export class BumpLogRepository {
  static create() {
    return new BumpLogRepository();
  }

  async findMany(filter: FilterQuery<BumpLog>) {
    return await BumpLogModel.find(filter);
  }

  async findOne(filter: FilterQuery<BumpLog>) {
    return await BumpLogModel.findOne(filter);
  }

  async createOne(doc: BumpLog) {
    return await BumpLogModel.create(doc);
  }

  async createMany(docs: BumpLog[]) {
    return await BumpLogModel.insertMany(docs);
  }

  async updateMany(filter: FilterQuery<BumpLog>, update: UpdateQuery<BumpLog>) {
    return await BumpLogModel.updateMany(filter, update);
  }

  async deleteMany(filter: FilterQuery<BumpLog>) {
    return await BumpLogModel.deleteMany(filter);
  }
}


