import { inject, injectable } from "tsyringe";

import { GuildType } from "#/shared/db/models/uppy-discord/guild.model.js";
import { PremiumModel } from "#/shared/db/models/uppy-discord/premium.model.js";
import { GuildRepository } from "#/shared/db/repositories/uppy-discord/guild.repository.js";
import { scheduleManager } from "#/shared/libs/schedule/schedule.manager.js";

@injectable()
export class PremiumSubscriptionManager {
  constructor(
    @inject(GuildRepository) private guildRepository: GuildRepository,
  ) {}

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
      this.guildRepository.update(guildId, {
        type: GuildType.Premium,
        isActive: true,
      }),
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
      this.guildRepository.update(guildId, {
        type: GuildType.Premium,
        isActive: true,
      }),
      scheduleManager.startOnceJob(this.generateId(guildId), newExpiresAt, () =>
        this.stopPremium(guildId),
      ),
    ]);
  }

  async bulkRemove(guildIds: string[]) {
    await Promise.all([
      this.guildRepository.updateMany(
        { guildId: { $in: guildIds } },
        { type: GuildType.Common },
      ),
      PremiumModel.deleteMany({ guildId: { $in: guildIds } }),
      this.guildRepository.cleanUpCache(guildIds),
    ]);
  }

  async remove(guildId: string) {
    scheduleManager.stopJob(this.generateId(guildId));
    await this.stopPremium(guildId);
  }

  private async stopPremium(guildId: string) {
    await Promise.all([
      this.guildRepository.update(guildId, { type: GuildType.Common }),
      PremiumModel.deleteOne({ guildId }),
    ]);
  }

  private generateId(guildId: string) {
    return `${guildId}-premium`;
  }
}
