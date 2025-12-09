import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import { DateTime } from "luxon";
import { inject, injectable } from "tsyringe";

import { PromocodeModel } from "#/shared/db/models/uppy-discord/promocode.model.js";

import { PromocodeService } from "../../promocodes/promocode.service.js";
import { PremiumSubscriptionManager } from "../subscription-manager/subscription.service.js";

@injectable()
export class PremiumActivatePromocodeService {
  constructor(
    @inject(PremiumSubscriptionManager)
    private subscriptionManager: PremiumSubscriptionManager,
    @inject(PromocodeService) private promocodeService: PromocodeService
  ) {}

  async handleActivatePromocode(
    code: string,
    interaction: ChatInputCommandInteraction
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const promocode = await PromocodeModel.model.findOne({
      code,
    });

    if (!promocode) {
      return interaction.editReply({
        content: "Указанный промокод не существует",
      });
    }

    if (promocode.entries.length + 1 === promocode.activations) {
      return interaction.editReply({
        content: "Исчерпан лимит активаций",
      });
    }

    const isActivated = await this.promocodeService.isPromocodeActivated(
      interaction.guildId!,
      code
    );

    if (isActivated) {
      return interaction.editReply({
        content: "Вы уже активировали этот промокод",
      });
    }

    const existedPremium = await this.subscriptionManager.findExisted(
      interaction.guildId!
    );
    const expiresAt = existedPremium
      ? DateTime.fromJSDate(existedPremium.expiresAt)
      : DateTime.now();

    const newExpires = expiresAt.plus({ milliseconds: promocode.durationMs });

    await this.subscriptionManager.reveal(
      interaction.guildId!,
      newExpires.toJSDate()
    );

    await this.promocodeService.activatePromocode(interaction.guildId!, code);

    await interaction.editReply({
      content: "Промокод успешно активирован",
    });
  }
}
