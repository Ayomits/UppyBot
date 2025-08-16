import type { RootFilterQuery } from "mongoose";

import type { HelperDocument } from "#/db/models/helper.model.js";
import { HelperModel } from "#/db/models/helper.model.js";

export class HelperRepository {
  public async findByUserAndGuild(
    userId: string,
    guildId: string
  ): Promise<HelperDocument | null> {
    return await HelperModel.findOne({ userId, guildId }).exec();
  }

  public async isHelper(userId: string, guildId: string): Promise<boolean> {
    const helper = await this.findByUserAndGuild(userId, guildId);
    return helper !== null;
  }

  public async updateHelper(
    userId: string,
    guildId: string,
    update: Partial<HelperDocument>
  ): Promise<HelperDocument | null> {
    return await HelperModel.findOneAndUpdate({ userId, guildId }, update, {
      new: true,
    });
  }

  public async createHelper(
    data: Partial<HelperDocument>
  ): Promise<HelperDocument> {
    return await HelperModel.create(data);
  }

  public async deleteHelper(
    filter: RootFilterQuery<HelperDocument>
  ): Promise<void> {
    await HelperModel.deleteOne(filter);
  }
}
