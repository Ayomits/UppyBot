import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import { Discord } from "discordx";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import type { PremiumDocument } from "#/models/premium.model.js";
import { PremiumModel } from "#/models/premium.model.js";

import { PremiumSubscriptionManager } from "../subscription/subscription.service.js";

@injectable()
@Discord()
export class PremiumGiveService {
  constructor(
    @inject(PremiumSubscriptionManager)
    private premiumManager: PremiumSubscriptionManager,
  ) {}

  async handleGive(
    period: string,
    guildId: string,
    interaction: ChatInputCommandInteraction,
  ) {
    const existed = await PremiumModel.findOne({ guildId });

    const fn = existed
      ? this.premiumManager.assign.bind(this.premiumManager)
      : this.premiumManager.reveal.bind(this.premiumManager);

    await fn(guildId, this.resolvePeriod(period, existed));

    await interaction.reply({
      content: "Премиум успешно назначен",
      flags: MessageFlags.Ephemeral,
    });
  }

  private resolvePeriod(period: string, existed: PremiumDocument | null) {
    const date = DateTime.fromJSDate(existed ? existed.expiresAt : new Date());
    switch (period) {
      case "hour":
        date.plus({ hours: 1 });
        break;
      case "day":
        date.plus({ days: 1 });
        break;
      case "week":
        date.plus({ weeks: 1 });
        break;
      case "month":
        date.plus({ months: 1 });
        break;
      case "year":
        date.plus({ years: 1 });
        break;
    }
    return date.toJSDate();
  }
}
