import { IsGuildUser } from "@discordx/utilities";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type ChatInputCommandInteraction,
  type User,
  type UserContextMenuCommandInteraction,
} from "discord.js";
import {
  ContextMenu,
  Discord,
  Guard,
  Slash,
  SlashGroup,
  SlashOption,
} from "discordx";
import { inject, singleton } from "tsyringe";

import { GuildOnly } from "#/discord/guards/is-guild-only.js";
import { IsHelper } from "#/discord/guards/is-staff.guard.js";

import { RemainingService } from "./interactions/remaining.service.js";
import { StatsAutocompleteService } from "./interactions/stats-autocomplete.service.js";
import { StatsHistoryService } from "./interactions/stats-history.service.js";
import { StatsInfoService } from "./interactions/stats-info.service.js";
import { LeaderboardService } from "./interactions/stats-top.service.js";

@Discord()
@singleton()
@SlashGroup({
  name: "stats",
  description: "Статистика",
  dmPermission: false,
})
export class UppyController {
  constructor(
    @inject(StatsHistoryService) private uppyStatsService: StatsHistoryService,
    @inject(LeaderboardService)
    private uppyTopService: LeaderboardService,
    @inject(RemainingService)
    private uppyRemainingService: RemainingService,
    @inject(StatsInfoService) private uppyInfoService: StatsInfoService,
  ) {}

  @Slash({
    name: "remaining",
    description: "Время до команд",
    dmPermission: false,
  })
  @Guard(IsHelper, IsGuildUser(GuildOnly))
  remaining(interaction: ChatInputCommandInteraction) {
    return this.uppyRemainingService.handleRemainingCommand(interaction);
  }

  @Slash({
    name: "info",
    description: "Статистика сотрудника",
  })
  @SlashGroup("stats")
  @Guard(IsHelper, IsGuildUser(GuildOnly))
  uppyInfoSlash(
    @SlashOption({
      type: ApplicationCommandOptionType.User,
      name: "user",
      description: "Пользователь (по-умолчанию ВЫ)",
      required: false,
    })
    user: User,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "from",
      description: "От какой даты",
      autocomplete: StatsAutocompleteService.handleTopAutocomplete.bind(
        StatsAutocompleteService,
      ),
      required: false,
    })
    from: string,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "to",
      description: "До какой даты",
      autocomplete: StatsAutocompleteService.handleTopAutocomplete.bind(
        StatsAutocompleteService,
      ),
      required: false,
    })
    to: string,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.uppyInfoService.handleInfoCommand(interaction, user, from, to);
  }

  @Slash({
    name: "top",
    description: "Таблица лидеров",
  })
  @SlashGroup("stats")
  @Guard(IsHelper, IsGuildUser(GuildOnly))
  uppyTopSlash(
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "from",
      description: "От какой даты",
      autocomplete: StatsAutocompleteService.handleTopAutocomplete.bind(
        StatsAutocompleteService,
      ),
      required: false,
    })
    from: string,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "to",
      description: "До какой даты",
      autocomplete: StatsAutocompleteService.handleTopAutocomplete.bind(
        StatsAutocompleteService,
      ),
      required: false,
    })
    to: string,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.uppyTopService.handleTopCommand(interaction, from, to);
  }

  @ContextMenu({
    name: "Статистика пользователя",
    type: ApplicationCommandType.User,
  })
  @Guard(IsHelper, IsGuildUser(GuildOnly))
  uppyInfoContext(interaction: UserContextMenuCommandInteraction) {
    return this.uppyInfoService.handleInfoCommand(
      interaction,
      interaction.targetUser,
    );
  }

  @Slash({
    name: "history",
    description: "История команд",
  })
  @SlashGroup("stats")
  @Guard(IsHelper, IsGuildUser(GuildOnly))
  uppyHistory(
    @SlashOption({
      type: ApplicationCommandOptionType.User,
      name: "user",
      description: "Пользователь",
      required: false,
    })
    user: User,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.uppyStatsService.handleStatsCommand(interaction, user);
  }
}
