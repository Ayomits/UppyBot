import { injectable } from "tsyringe";

import { scheduleManager } from "#/libs/schedule/schedule.manager.js";
import { UppyGuildModel, UppyGuildType } from "#/db/models/guild.model.js";
import { PremiumModel } from "#/db/models/premium.model.js";

@injectable()
export class PremiumSubscriptionManager {
  async init() {
    const [expiredSubscriptions, nonExpiredSubscriptions] = await Promise.all([
      PremiumModel.find({
        expiresAt: { $lte: Date.now() },
      }).select("guildId"),
      PremiumModel.find({ expiresAt: { $gt: Date.now() } }).select([
        "guildId",
        "expiresAt",
      ]),
    ]);

    this.bulkRemove(expiredSubscriptions.map((doc) => doc.guildId));
    for (const doc of nonExpiredSubscriptions) {
      scheduleManager.startOnceJob(
        this.generateId(doc.guildId),
        doc.expiresAt,
        () => this.stopPremium(doc.guildId),
      );
    }
  }

  async assign(guildId: string, expiresAt: Date) {
    scheduleManager.startOnceJob(this.generateId(guildId), expiresAt, () =>
      this.stopPremium(guildId),
    );
    await Promise.all([
      PremiumModel.findOneAndUpdate(
        { guildId },
        { expiresAt },
        { upsert: true },
      ),
      UppyGuildModel.findOneAndUpdate(
        { guildId },
        { type: UppyGuildType.Premium, isActive: true },
        { upsert: true },
      ),
    ]);
  }

  async reveal(guildId: string, newExpiresAt: Date) {
    scheduleManager.stopJob(this.generateId(guildId));
    await Promise.allSettled([
      PremiumModel.findOneAndUpdate(
        { guildId },
        { expiresAt: newExpiresAt },
        { upsert: true },
      ),
      UppyGuildModel.findOneAndUpdate(
        { guildId },
        { type: UppyGuildType.Premium, isActive: true },
        { upsert: true },
      ),
      scheduleManager.startOnceJob(this.generateId(guildId), newExpiresAt, () =>
        this.stopPremium(guildId),
      ),
    ]);
  }

  async bulkRemove(guildIds: string[]) {
    await Promise.all([
      UppyGuildModel.updateMany(
        { guildId: { $in: guildIds } },
        { type: UppyGuildType.Common },
      ),
      PremiumModel.deleteMany({ guildId: { $in: guildIds } }),
    ]);
  }

  async remove(guildId: string) {
    scheduleManager.stopJob(this.generateId(guildId));
    await this.stopPremium(guildId);
  }

  private async stopPremium(guildId: string) {
    await Promise.all([
      UppyGuildModel.updateOne({ guildId }, { type: UppyGuildType.Common }),
      PremiumModel.deleteOne({ guildId }),
    ]);
  }

  private generateId(guildId: string) {
    return `${guildId}-premium`;
  }
}
