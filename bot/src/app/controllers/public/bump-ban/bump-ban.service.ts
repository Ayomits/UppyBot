import type { Guild, GuildMember, Role } from "discord.js";
import type { Client } from "discordx";
import { inject, injectable } from "tsyringe";

import type { BumpBan } from "#/db/models/bump-ban.model.js";
import { BumpBanModel } from "#/db/models/bump-ban.model.js";
import { type SettingsDocument } from "#/db/models/settings.model.js";
import { SettingsRepository } from "#/db/repositories/settings.repository.js";
import { CryptographyService } from "#/libs/crypto/index.js";

import { WebhookManager } from "../../webhooks/webhook.manager.js";
import { WebhookNotificationType } from "../../webhooks/webhook.types.js";
import { BumpLogService } from "../logging/log.service.js";
import { BumpBanLimit, MonitoringType } from "../reminder/reminder.const.js";

type ActionOptions = {
  member: GuildMember;
  type: number;
  settings?: SettingsDocument | null;
  force?: {
    shouldDbQuery?: boolean;
    shouldRoleAction?: boolean;
  };
  prioritizeForce?: boolean;
};

@injectable()
export class BumpBanService {
  constructor(
    @inject(BumpLogService) private logService: BumpLogService,
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
    @inject(WebhookManager) private webhookManager: WebhookManager,
    @inject(CryptographyService) private cryptography: CryptographyService
  ) {}

  async handleBumpBanInit(client: Client) {
    const guilds = client.guilds.cache;

    for (const [, guild] of guilds) {
      const [settings, bans] = await Promise.all([
        this.settingsRepository.findGuildSettings(guild.id),
        BumpBanModel.find({
          guildId: guild.id,
          type: { $in: Object.values(MonitoringType) },
        }),
      ]);

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
    }
  }

  async handlePostIncrementBumpBans(guild: Guild, type: number) {
    const [bans, settings] = await Promise.all([
      BumpBanModel.find({
        guildId: guild.id,
        type,
        removeIn: { $gte: BumpBanLimit },
      }),
      await this.settingsRepository.findGuildSettings(guild.id),
    ]);

    for (const ban of bans) {
      const member = await guild.members.fetch(ban.userId).catch(() => null);

      if (!member) {
        continue;
      }

      this.removeBumpBan({
        member,
        settings,
        type,
      });
    }
  }

  async handleMemberUpdate(member: GuildMember) {
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
    settings?: SettingsDocument | null,
    bumpBan?: BumpBan | null
  ): Promise<
    | {
        params: ActionOptions["force"];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fn: any;
        settings: SettingsDocument;
        bumpBan: BumpBan;
      }
    | undefined
  > {
    settings = settings
      ? settings
      : await this.settingsRepository.findGuildSettings(member.guild.id);
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

    const role = await guild.roles
      .fetch(settings?.bumpBan.roleId ?? "")
      .catch(null);

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
      : await this.settingsRepository.findGuildSettings(
          options.member.guild.id
        );

    const guild = options.member.guild;

    const role = await guild.roles
      .fetch(options.settings?.bumpBan.roleId ?? "")
      .catch(null);

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
      return false;
    }

    if (options.settings.webhooks.url) {
      this.webhookManager.pushConsumer(
        options.settings.webhooks.url,
        this.cryptography.decrypt(options.settings.webhooks.token!),
        this.webhookManager.createBumpBanPayload(
          WebhookNotificationType.BumpBanRemoval,
          {
            userId: options.member.id,
            executedAt: new Date(),
          }
        )
      );
    }

    await Promise.all([
      BumpBanModel.findOneAndUpdate(
        filter,
        {},
        { upsert: true, setDefaultsOnInsert: true }
      ),
      options.member.roles.add(role).catch(() => null),
      this.logService.sendBumpBanCreationLog(guild, options.member.user),
    ]);

    return true;
  }

  async removeBumpBan(options: ActionOptions) {
    options.settings = options.settings
      ? options.settings
      : await this.settingsRepository.findGuildSettings(
          options.member.guild.id
        );

    const guild = options.member.guild;

    const role = await guild.roles.fetch(
      options.settings?.bumpBan.roleId ?? ""
    );

    if (!role) {
      return false;
    }

    const filter = {
      guildId: guild.id,
      userId: options.member.id,
      type: options.type,
    };

    const { hasBumpBan, hasRole } = await this.verifyBumpBan({
      shouldDbQuery: options.force?.shouldDbQuery ?? options?.prioritizeForce,
      shouldRoleAction:
        options.force?.shouldRoleAction ?? options?.prioritizeForce,
      member: options.member,
      role,
      type: options.type,
    });

    if (!hasBumpBan || !hasRole) {
      return false;
    }

    if (options.settings.webhooks.url) {
      this.webhookManager.pushConsumer(
        options.settings.webhooks.url,
        this.cryptography.decrypt(options.settings.webhooks.token!),
        this.webhookManager.createBumpBanPayload(
          WebhookNotificationType.BumpBanRemoval,
          {
            userId: options.member.id,
            executedAt: new Date(),
          }
        )
      );
    }

    await Promise.all([
      options.member.roles.remove(role),
      BumpBanModel.deleteOne(filter),
      this.logService.sendBumpBanRemovalLog(guild, options.member.user),
    ]);
    return true;
  }
}
