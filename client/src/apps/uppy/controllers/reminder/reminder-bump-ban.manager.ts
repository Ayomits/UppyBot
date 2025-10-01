import type { Client } from "discord.js";
import { inject, injectable } from "tsyringe";

import { scheduleManager } from "#/libs/schedule/schedule.manager.js";
import { BumpBanModel } from "#/models/bump-ban.model.js";
import { SettingsModel } from "#/models/settings.model.js";

import { UppyLogService } from "../logging/log.service.js";
import { BumpBanCheckerInterval, BumpBanLimit } from "./reminder.const.js";

@injectable()
export class RemindBumpBanManager {
  constructor(@inject(UppyLogService) private logService: UppyLogService) {}

  public async initBumpBan(client: Client) {
    await this.handleBumpBan(client);
    scheduleManager.startPeriodJob("bump-ban", BumpBanCheckerInterval, () => {
      this.handleBumpBan(client);
    });
  }

  private async handleBumpBan(client: Client) {
    const guilds = client.guilds.cache;
    const ids = guilds.map((guild) => guild.id);

    const filter = {
      guildId: { $in: ids },
    };

    const [bans, settings] = await Promise.all([
      BumpBanModel.find(filter),
      SettingsModel.find(filter),
    ]);

    const settingsMap = Object.fromEntries(
      settings?.map((s) => [s.guildId, s]),
    );

    const entriesMap = Object.fromEntries(
      bans.map((ban) => [
        `remind.guildId-${Math.random()}`,
        { ban, settings: settingsMap[ban.guildId] },
      ]),
    );

    for (const [, entry] of Object.entries(entriesMap)) {
      const { ban, settings } = entry;
      const guild = guilds.get(entry.ban.guildId);

      const [member, role] = await Promise.all([
        guild.members.fetch(ban.userId).catch(() => null),
        guild.roles
          .fetch(settings?.bumpBanRoleId, { cache: true })
          .catch(() => null),
      ]);

      if (role && member) {
        const hasRole = member.roles.cache.has(role.id);
        if (ban.removeIn >= BumpBanLimit) {
          await this.logService.sendBumpBanRemovalLog(guild, member);
          member.roles.remove(role).catch(() => null);
          continue;
        }

        if (ban.removeIn < BumpBanLimit) {
          if (!hasRole) {
            member.roles.add(role).catch(() => null);
            await this.logService.sendBumpBanRoleAddingLog(guild, member);
          }
        }
      }
    }

    await BumpBanModel.deleteMany({
      ...filter,
      removeIn: { $gte: BumpBanLimit },
    });
  }
}
