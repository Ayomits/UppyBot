import { inject, injectable } from "tsyringe";

import { appEventEmitter } from "#/discord/events/emitter.js";
import { GuildType } from "#/shared/db/models/uppy-discord/guild.model.js";
import type {
  PremiumDocument} from "#/shared/db/models/uppy-discord/premium.model.js";
import {
  PremiumModel,
} from "#/shared/db/models/uppy-discord/premium.model.js";
import { GuildRepository } from "#/shared/db/repositories/uppy-discord/guild.repository.js";
import { scheduleManager } from "#/shared/libs/schedule/schedule.manager.js";

@injectable()
export class PremiumSubscriptionManager {
  constructor(
    @inject(GuildRepository) private guildRepository: GuildRepository
  ) {}

  async init() {
    const [expiredSubscriptions, nonExpiredSubscriptions] = await Promise.all([
      PremiumModel.model
        .find({
          expiresAt: { $lte: Date.now() },
        })
        .select("guildId"),
      PremiumModel.model
        .find({ expiresAt: { $gt: Date.now() } })
        .select(["guildId", "expiresAt"]),
    ]);

    for (const doc of expiredSubscriptions) {
      const guild = await this.getGuildInfo(doc.guildId);
      if (guild) {
        appEventEmitter.emit("premium:expired", {
          guildId: doc.guildId,
          guildName: guild.guildName,
          guildAvatar: guild.avatar,
          created: doc.createdAt ?? new Date(),
        });
      }
    }

    this.bulkRemove(
      expiredSubscriptions.map((doc) => ({
        guildId: doc.guildId,
        created: doc.createdAt ?? new Date(),
      }))
    );

    for (const doc of nonExpiredSubscriptions) {
      scheduleManager.startOnceJob(
        this.generateId(doc.guildId),
        doc.expiresAt,
        () => this.stopPremium(doc.guildId)
      );
    }
  }

  async findExisted(guildId: string) {
    return (await PremiumModel.model.findOne({
      guildId,
    })) as PremiumDocument | null;
  }

  async assign(guildId: string, expiresAt: Date) {
    scheduleManager.startOnceJob(this.generateId(guildId), expiresAt, () =>
      this.stopPremium(guildId)
    );

    const guild = await this.getGuildInfo(guildId);

    await Promise.all([
      PremiumModel.model.findOneAndUpdate(
        { guildId },
        { expiresAt },
        { upsert: true }
      ),
      this.guildRepository.update(guildId, {
        type: GuildType.Premium,
        isActive: true,
      }),
    ]);

    if (guild) {
      appEventEmitter.emit("premium:created", {
        guildName: guild.guildName,
        guildAvatar: guild.avatar,
        until: expiresAt,
      });
    }
  }

  async reveal(guildId: string, newExpiresAt: Date) {
    scheduleManager.stopJob(this.generateId(guildId));

    const guild = await this.getGuildInfo(guildId);

    await Promise.allSettled([
      PremiumModel.model.findOneAndUpdate(
        { guildId },
        { expiresAt: newExpiresAt },
        { upsert: true }
      ),
      this.guildRepository.update(guildId, {
        type: GuildType.Premium,
        isActive: true,
      }),
      scheduleManager.startOnceJob(this.generateId(guildId), newExpiresAt, () =>
        this.stopPremium(guildId)
      ),
    ]);

    if (guild) {
      appEventEmitter.emit("premium:created", {
        guildName: guild.guildName,
        guildAvatar: guild.avatar,
        until: newExpiresAt,
      });
    }
  }

  async bulkRemove(guilds: { guildId: string; created: Date }[]) {
    for (const gd of guilds) {
      const guild = await this.getGuildInfo(gd.guildId);
      if (guild) {
        appEventEmitter.emit("premium:expired", {
          guildId: gd.guildId,
          guildName: guild.guildName,
          guildAvatar: guild.avatar,
          created: gd.created,
        });
      }
    }

    const ids = guilds.map((g) => g.guildId);

    await Promise.all([
      this.guildRepository.updateMany(
        { guildId: { $in: ids } },
        { type: GuildType.Common }
      ),
      PremiumModel.model.deleteMany({ guildId: { $in: ids } }),
      this.guildRepository.cleanUpCache(ids),
    ]);
  }

  async remove(guildId: string) {
    const premium = await PremiumModel.model.findOne({ guildId });
    scheduleManager.stopJob(this.generateId(guildId));

    const guild = await this.getGuildInfo(guildId);
    if (guild) {
      appEventEmitter.emit("premium:expired", {
        guildId: guildId,
        guildName: guild.guildName,
        guildAvatar: guild.avatar,
        created: premium.createdAt ?? new Date(),
      });
    }

    await this.stopPremium(guildId);
  }

  private async stopPremium(guildId: string) {
    await Promise.all([
      this.guildRepository.update(guildId, { type: GuildType.Common }),
      PremiumModel.model.deleteOne({ guildId }),
    ]);
  }

  private generateId(guildId: string) {
    return `${guildId}-premium`;
  }

  private async getGuildInfo(
    guildId: string
  ): Promise<{ guildName: string; avatar: string } | null> {
    try {
      const guild = await this.guildRepository.findGuild(guildId);
      return guild
        ? {
            guildName: guild.guildName,
            avatar: guild.avatar || "",
          }
        : null;
    } catch {
      return null;
    }
  }
}
