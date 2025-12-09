import {
  bold,
  ContainerBuilder,
  heading,
  HeadingLevel,
  time,
  TimestampStyles,
} from "discord.js";

import { discordClient } from "#/discord/client.js";
import {
  baseCommonRemindTemplate,
  baseForceRemindTemplate,
} from "#/discord/libs/templates/index.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { resolveTimestamp } from "#/shared/libs/embed/timestamp.js";

import { appEventEmitter } from "../emitter.js";
import type { AppPremiumCreated, AppPremiumExpired } from "../types.js";
import { AppEventHandler } from "./base.js";

export class AppPremiumEventHandler extends AppEventHandler {
  constructor() {
    super();
    appEventEmitter.on(
      "premium:created",
      this.handlePremiumCreatedLog.bind(this),
    );
    appEventEmitter.on(
      "premium:expired",
      this.handlePremiumExpiredLog.bind(this),
    );
    appEventEmitter.on(
      "premium:expired",
      this.handlePremiumExpiredTheming.bind(this),
    );
  }

  static create() {
    return new AppPremiumEventHandler();
  }

  private async handlePremiumCreatedLog(opts: AppPremiumCreated) {
    this.devLog("dev.premiumLogs", {
      components: [
        new ContainerBuilder().addTextDisplayComponents((b) =>
          b.setContent(
            [
              heading("Премиума подписка начислена", HeadingLevel.Two),
              `Серверу ${opts.guildName} начислена подписка до: ${time(resolveTimestamp(opts.until), TimestampStyles.LongDateTime)}`,
            ].join("\n"),
          ),
        ),
      ],
    });
  }

  private async handlePremiumExpiredLog(opts: AppPremiumExpired) {
    this.devLog("dev.premiumLogs", {
      components: [
        new ContainerBuilder().addSectionComponents((b) => {
          if (opts.guildAvatar) {
            b.setThumbnailAccessory((b) => b.setURL(opts.guildAvatar));
          }
          b.addTextDisplayComponents((b) =>
            b.setContent(
              [
                heading("Премиума подписка закончилась", HeadingLevel.Two),
                `У сервера ${bold(opts.guildName)} срок действия подписки был окончен`,
                `Дата начисления: ${time(resolveTimestamp(opts.created), TimestampStyles.LongDateTime)}`,
              ].join("\n"),
            ),
          );
          return b;
        }),
      ],
    });
  }

  private async handlePremiumExpiredTheming(opts: AppPremiumExpired) {
    const guild = await discordClient.guilds
      .fetch(opts.guildId)
      .catch(() => null);
    const settings = await SettingsRepository.create();

    if (!guild) {
      return;
    }

    await guild.members.editMe({
      bio: null,
      avatar: null,
      banner: null,
    });

    appEventEmitter.emit(
      "settings:updated",
      await settings.update(opts.guildId, {
        "theming.avatar": null,
        "theming.banner": null,
        "theming.bio": null,
        "templates.force": baseForceRemindTemplate,
        "templates.common": baseCommonRemindTemplate,
      }),
    );
  }
}
