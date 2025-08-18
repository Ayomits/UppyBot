import type { ChatInputCommandInteraction, User } from "discord.js";
import { ApplicationCommandOptionType } from "discord.js";
import { Discord, Slash, SlashChoice, SlashOption } from "discordx";
import { inject, singleton } from "tsyringe";

import type { Period } from "./helper.const.js";
import { HelperService } from "./helper.service.js";

@Discord()
@singleton()
export class HelperController {
  constructor(@inject(HelperService) private helperService: HelperService) {}

  @Slash({ description: "Профиль пользователя", name: "helper-info" })
  async HelperInfo(
    @SlashOption({
      description: "Хелпер, чей профиль нужно проверить",
      name: "user",
      nameLocalizations: {
        ru: "пользователь",
      },
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    user: User,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.helperService.handleHelperInfo(user, interaction);
  }

  @Slash({
    name: "helper-top",
    description: "Топ пользователей по активности на ветке",
  })
  async helperTop(
    @SlashChoice(
      { name: "Неделя", value: "weekly" },
      { name: "15 Дней", value: "twoweeks" },
      { name: "За всё время", value: "alltime" },
    )
    @SlashOption({
      name: "period",
      description: "Выберите период времени",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    period: Period,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.helperService.handleHelperTop(interaction, period);
  }

  @Slash({
    description: "Проверка времени до использования команд",
    name: "remaining",
  })
  async remainingSlash(interaction: ChatInputCommandInteraction) {
    return this.helperService.handleBumpRemaining(interaction);
  }
}
