import {
  bold,
  ContainerBuilder,
  heading,
  HeadingLevel,
  time,
  TimestampStyles,
} from "discord.js";

import { resolveTimestamp } from "#/shared/libs/embed/timestamp.js";

import { appEventEmitter } from "../emitter.js";
import type { AppPremiumCreated, AppPremiumExpired } from "../types.js";
import { AppEventHandler } from "./base.js";

export class AppPremiumEventHandler extends AppEventHandler {
  constructor() {
    super();
    appEventEmitter.on("premium:created", this.handlePremiumCreated);
    appEventEmitter.on("premium:expired", this.handlePremiumExpired);
  }

  static create() {
    return new AppPremiumEventHandler();
  }

  async handlePremiumCreated(opts: AppPremiumCreated) {
    this.devLog("dev.premiumLogs", {
      components: [
        new ContainerBuilder().addSectionComponents((b) => {
          if (opts.guildAvatar) {
            b.setThumbnailAccessory((b) => b.setURL(opts.guildAvatar));
          }
          b.addTextDisplayComponents((b) =>
            b.setContent(
              [
                heading("Премиума подписка начислена", HeadingLevel.Two),
                `Серверу ${opts.guildName} начислена подписка до: ${time(resolveTimestamp(opts.until), TimestampStyles.LongDateTime)}`,
              ].join("\n")
            )
          );
          return b;
        }),
      ],
    });
  }

  async handlePremiumExpired(opts: AppPremiumExpired) {
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
              ].join("\n")
            )
          );
          return b;
        }),
      ],
    });
  }
}
