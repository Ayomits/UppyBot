import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import { Discord } from "discordx";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import type { PremiumDocument } from "#/db/models/premium.model.js";
import { PremiumRepository } from "#/db/repositories/premium.repository.js";

import { PremiumSubscriptionManager } from "../subscription-manager/subscription.service.js";

@injectable()
@Discord()
export class PremiumGiveService {
  constructor(
    @inject(PremiumSubscriptionManager)
    private premiumManager: PremiumSubscriptionManager,
    @inject(PremiumRepository) private premiumRepository: PremiumRepository
  ) {}

  async handleGive(
    period: string,
    amount: number,
    guildId: string,
    interaction: ChatInputCommandInteraction
  ) {
    const existed = await this.premiumRepository.findByGuildId(guildId);

    const fn = !existed
      ? this.premiumManager.assign.bind(this.premiumManager)
      : this.premiumManager.reveal.bind(this.premiumManager);

    const date = this.resolvePeriod(period, amount, existed);
    await fn(guildId, date);

    await interaction.reply({
      content: "Премиум успешно назначен",
      flags: MessageFlags.Ephemeral,
    });
  }

  private resolvePeriod(
    period: string,
    amount: number,
    existed: PremiumDocument | null
  ) {
    let date = DateTime.fromJSDate(existed ? existed.expiresAt : new Date());
    switch (period) {
      case "hour":
        date = date.plus({ hours: amount });
        break;
      case "day":
        date = date.plus({ days: amount });
        break;
      case "week":
        date = date.plus({ weeks: amount });
        break;
      case "month":
        date = date.plus({ months: amount });
        break;
      case "year":
        date = date.plus({ years: amount });
        break;
    }
    return date.toJSDate();
  }
}
