import { injectable } from "tsyringe";

import type { BumpReminderModuleDocument } from "#/db/models/bump-reminder.model.js";
import { BumpReminderModuleModel } from "#/db/models/bump-reminder.model.js";

@injectable()
export class BumpReminderRepository {
  async findOrCreateByGuildId(
    guildId: string,
  ): Promise<BumpReminderModuleDocument> {
    let doc = await BumpReminderModuleModel.findOne({ guildId }).exec();
    if (!doc) {
      doc = new BumpReminderModuleModel({
        guildId,
        enable: false,
        helperRoleID: [],
        bumpbanRole: [],
        pingChannelId: null,
        sdcMonitoring: {},
        discordMonitoring: {},
        serverMonitoring: {},
      });
      await doc.save();
    }
    return doc;
  }

  async create(
    data: Partial<BumpReminderModuleDocument>,
  ): Promise<BumpReminderModuleDocument> {
    const doc = new BumpReminderModuleModel(data);
    return await doc.save();
  }

  async updateByGuildId(
    guildId: string,
    update: Partial<BumpReminderModuleDocument>,
  ): Promise<BumpReminderModuleDocument | null> {
    return await BumpReminderModuleModel.findOneAndUpdate({ guildId }, update, {
      new: true,
    }).exec();
  }

  async enableModule(
    guildId: string,
  ): Promise<BumpReminderModuleDocument | null> {
    return await this.updateByGuildId(guildId, { enable: true });
  }

  async disableModule(
    guildId: string,
  ): Promise<BumpReminderModuleDocument | null> {
    return await this.updateByGuildId(guildId, { enable: false });
  }
}
