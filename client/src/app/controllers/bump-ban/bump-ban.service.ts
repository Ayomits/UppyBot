import type { GuildMember, Role } from "discord.js";
import type { Client } from "discordx";
import { inject, injectable } from "tsyringe";

import type { BumpBan } from "#/models/bump-ban.model.js";
import { BumpBanModel } from "#/models/bump-ban.model.js";
import type { UppySettingsDocument } from "#/models/settings.model.js";
import { UppySettingsModel } from "#/models/settings.model.js";

import { UppyLogService } from "../logging/log.service.js";
import { BumpBanLimit, MonitoringType } from "../reminder/reminder.const.js";

type ActionOptions = {
  member: GuildMember;
  type: number;
  settings?: UppySettingsDocument | null;
  force?: {
    shouldDbQuery: boolean;
    shouldRoleAction: boolean;
  };
};

@injectable()
export class BumpBanService {
  constructor(@inject(UppyLogService) private logService: UppyLogService) {}

  async handleBumpBan(client: Client) {
    const guilds = client.guilds.cache;

    for (const [, guild] of guilds) {
      const [settings, bans] = await Promise.all([
        UppySettingsModel.findOneAndUpdate(
          { guildId: guild.id },
          {},
          { upsert: true }
        ),
        BumpBanModel.find({
          guildId: guild.id,
          type: { $in: Object.values(MonitoringType) },
        }),
      ]);

      const members = (await guild.members.fetch()).filter((m) =>
        m.roles.cache.has(settings?.bumpBanRoleId ?? "")
      );

      for (const ban of bans) {
        const member = await guild.members.fetch(ban.userId).catch(() => null);
        if (!member) {
          continue;
        }
        const action = await this.verifyAction(member, ban.type, settings, ban);
        action?.fn.bind(this)({
          member,
          type: ban.type,
          settings,
          force: action.params,
        });
      }

      if (members.size > 0 && members.size !== bans.length) {
        const bansUserIds = bans.map((b) => b.userId);
        const membersForCheck = members.filter(
          (m) => !bansUserIds.includes(m.id)
        );
        for (const [, member] of membersForCheck) {
          for (const type of Object.values(MonitoringType)) {
            const action = await this.verifyAction(member, type, settings);
            action?.fn.bind(this)({
              member,
              type: type,
              settings,
              force: action.params,
            });
          }
        }
      }
    }
  }

  async processMember(member: GuildMember) {
    const [entry] = await BumpBanModel.aggregate([
      {
        $match: {
          guildId: member.guild.id,
          userId: member.id,
        },
      },
      {
        $group: {
          _id: null,
          types: {
            $push: "$type",
          },
        },
      },
    ]);

    if (!entry) {
      return;
    }

    for (const type of entry.types) {
      const action = await this.verifyAction.bind(this)(member, type);

      if (!action) {
        return;
      }

      const { bumpBan, settings, params, fn } = action;

      if (!bumpBan) {
        return;
      }

      fn.bind(this)({
        member,
        type: bumpBan.type,
        settings,
        force: params,
      });
    }
  }

  private async verifyAction(
    member: GuildMember,
    type: number,
    settings?: UppySettingsDocument | null,
    bumpBan?: BumpBan | null
  ): Promise<
    | {
        params: ActionOptions["force"];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fn: any;
        settings: UppySettingsDocument;
        bumpBan: BumpBan;
      }
    | undefined
  > {
    settings = settings
      ? settings
      : await UppySettingsModel.findOneAndUpdate(
          { guildId: member.guild.id },
          {},
          { upsert: true }
        )!;

    bumpBan = bumpBan
      ? bumpBan
      : await BumpBanModel.findOne({
          guildId: member.guild.id,
          userId: member.id,
          type,
        });

    if (!bumpBan) {
      return;
    }

    const guild = member.guild;

    const role = guild.roles.cache.get(settings?.bumpBanRoleId ?? "");

    if (!role) {
      return;
    }

    const canRemoveBumpBan = (bumpBan?.removeIn ?? 0) >= BumpBanLimit;
    const hasRole = member.roles.cache.has(role.id);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    let fn: Function;

    if (!hasRole || canRemoveBumpBan) {
      fn = this.removeBumpBan;
    } else {
      fn = this.addBumpBan;
    }

    return {
      params: {
        shouldDbQuery: !canRemoveBumpBan,
        shouldRoleAction: !hasRole,
      },
      fn,
      settings: settings!,
      bumpBan: bumpBan!,
    };
  }

  private async verifyBumpBan(
    options: Partial<ActionOptions["force"]> & {
      member: GuildMember;
      role: Role;
      type: number;
    }
  ) {
    let hasRole: boolean = options.shouldRoleAction === true;
    let hasBumpBan: boolean = options.shouldDbQuery === false;

    if (!hasRole) {
      hasRole = options.member.roles.cache.has(options.role.id);
    }

    if (!hasBumpBan) {
      hasBumpBan =
        ((await BumpBanModel.countDocuments({
          guildId: options.member.guild.id,
          userId: options.member.id,
          type: options.type,
        })) ?? 0) > 0;
    }

    return {
      hasBumpBan,
      hasRole,
    };
  }

  async addBumpBan(options: ActionOptions) {
    options.settings = options.settings
      ? options.settings
      : await UppySettingsModel.findOneAndUpdate(
          { guildId: options.member.guild.id },
          {},
          { upsert: true }
        )!;

    const guild = options.member.guild;

    const role = guild.roles.cache.get(options.settings?.bumpBanRoleId ?? "");

    if (!role) {
      return false;
    }

    const filter = {
      guildId: guild.id,
      userId: options.member.id,
      type: options.type,
    };

    const { hasBumpBan, hasRole } = await this.verifyBumpBan({
      shouldDbQuery: options.force?.shouldDbQuery,
      shouldRoleAction: options.force?.shouldRoleAction,
      member: options.member,
      role,
      type: options.type,
    });

    if (!hasBumpBan && hasRole) {
      await BumpBanModel.findOneAndUpdate(filter, {}, { upsert: true });
      this.logService.sendBumpBanCreationLog(guild, options.member.user);
      return true;
    }

    if (hasBumpBan && !hasRole) {
      options.member.roles.add(role).catch(() => null);
      this.logService.sendBumpBanRoleAddingLog(guild, options.member.user);
      return true;
    }

    if (hasBumpBan && hasRole) {
      return false;
    }

    await Promise.all([
      BumpBanModel.findOneAndUpdate(filter, {}, { upsert: true }),
      options.member.roles.add(role).catch(() => null),
      this.logService.sendBumpBanCreationLog(guild, options.member.user),
      this.logService.sendBumpBanRoleAddingLog(guild, options.member.user),
    ]);

    return true;
  }

  async removeBumpBan(options: ActionOptions) {
    options.settings = options.settings
      ? options.settings
      : await UppySettingsModel.findOneAndUpdate(
          { guildId: options.member.guild.id },
          {},
          { upsert: true }
        )!;

    const guild = options.member.guild;

    const role = guild.roles.cache.get(options.settings?.bumpBanRoleId ?? "");

    if (!role) {
      return false;
    }

    const filter = {
      guildId: guild.id,
      userId: options.member.id,
      type: options.type,
    };

    const { hasBumpBan, hasRole } = await this.verifyBumpBan({
      shouldDbQuery: options.force?.shouldDbQuery,
      shouldRoleAction: options.force?.shouldRoleAction,
      member: options.member,
      role,
      type: options.type,
    });

    if (hasBumpBan && hasRole) {
      await Promise.all([
        options.member.roles.remove(role),
        await BumpBanModel.deleteOne(filter),
        this.logService.sendBumpBanRemovalLog(guild, options.member.user),
      ]);
      return true;
    }

    if (!hasBumpBan && hasRole) {
      options.member.roles.remove(role);
      this.logService.sendBumpBanRemovalLog(guild, options.member.user);
      return true;
    }

    if (hasRole && !hasBumpBan) {
      await BumpBanModel.deleteOne(filter);
      this.logService.sendBumpBanRemovalLog(guild, options.member.user);
      return true;
    }

    if (!hasBumpBan && !hasRole) {
      return false;
    }
  }
}
