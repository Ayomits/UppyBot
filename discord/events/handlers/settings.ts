import { BumpBanService } from "#/discord/app/public/bump-ban/bump-ban.service.js";
import { MonitoringType } from "#/discord/app/public/reminder/reminder.const.js";
import { ReminderScheduleManager } from "#/discord/app/public/reminder/reminder.schedule.js";
import { discordClient } from "#/discord/client.js";
import { appEventEmitter } from "#/discord/events/index.js";
import { BumpBanModel } from "#/shared/db/models/uppy-discord/bump-ban.model.js";
import { RemindModel } from "#/shared/db/models/uppy-discord/remind.model.js";
import type {
  Settings,
  SettingsDocument,
} from "#/shared/db/models/uppy-discord/settings.model.js";

export class AppSettingsEventHandler {
  constructor() {
    appEventEmitter.on("settings:updated", this.handleBumpBanUpdate.bind(this));
    appEventEmitter.on("settings:updated", this.handleRemindUpdate.bind(this));
    appEventEmitter.on("settings:updated", this.handleThemingUpdate.bind(this));
  }

  static create() {
    return new AppSettingsEventHandler();
  }

  private async handleBumpBanUpdate(opts: Partial<Settings>) {
    if (opts.bumpBan?.enabled) {
      return;
    }
    const guild = await discordClient.guilds
      .fetch(opts.guildId!)
      .catch(() => null);

    if (!guild) {
      return;
    }

    const bumpBanned = await BumpBanModel.model.find({ guildId: guild.id });

    const bumpBanService = BumpBanService.create();

    for (const banned of bumpBanned) {
      const member = await guild.members.fetch(banned.userId).catch(() => null);

      if (!member) {
        return;
      }

      await bumpBanService.removeBumpBan({
        member,
        settings: opts as SettingsDocument,
        type: MonitoringType.ServerMonitoring,
        force: {
          shouldDbQuery: true,
          shouldRoleAction: true,
        },
      });
    }
  }

  private async handleRemindUpdate(opts: Partial<Settings>) {
    const reminds = await RemindModel.model.find({ guildId: opts.guildId });

    if (reminds.length === 0) {
      return;
    }
    const scheduleManager = ReminderScheduleManager.create();

    const guild = await discordClient.guilds
      .fetch(opts.guildId!)
      .catch(() => null);

    if (!guild) {
      return;
    }

    const isForceDisabled = opts?.force!.seconds === 0 || !opts.force!.enabled;
    const isCommonDisabled = !opts?.remind!.enabled;

    const guildId = opts.guildId!;

    if (isCommonDisabled) {
      scheduleManager.deleteAllReminds(guildId, "common");
      return;
    }

    if (isForceDisabled) {
      scheduleManager.deleteAllReminds(guildId, "force");
      return;
    }

    for (const remind of reminds) {
      scheduleManager.remind({
        guild,
        settings: opts as SettingsDocument,
        type: remind.type!,
        timestamp: remind.timestamp,
      });
    }
  }

  private async handleThemingUpdate(opts: Partial<Settings>) {}
}
