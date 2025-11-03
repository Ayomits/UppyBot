import type { FilterQuery, UpdateQuery } from "mongoose";
import { injectable } from "tsyringe";

import type { RemindLog } from "#/db/models/remind-logs.model.js";
import { RemindLogsModel } from "#/db/models/remind-logs.model.js";

@injectable()
export class RemindLogsRepository {
  static create() {
    return new RemindLogsRepository();
  }

  async findMany(filter: FilterQuery<RemindLog>) {
    return await RemindLogsModel.find(filter);
  }

  async findOne(filter: FilterQuery<RemindLog>) {
    return await RemindLogsModel.findOne(filter);
  }

  async createOne(doc: RemindLog) {
    return await RemindLogsModel.create(doc);
  }

  async createMany(docs: RemindLog[]) {
    return await RemindLogsModel.insertMany(docs);
  }

  async updateMany(
    filter: FilterQuery<RemindLog>,
    update: UpdateQuery<RemindLog>
  ) {
    return await RemindLogsModel.updateMany(filter, update);
  }

  async deleteMany(filter: FilterQuery<RemindLog>) {
    return await RemindLogsModel.deleteMany(filter);
  }
}


