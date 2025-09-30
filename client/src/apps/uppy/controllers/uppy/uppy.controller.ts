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

import { IsHelper } from "#/apps/uppy/guards/is-helper.guard.js";
import { GuildOnly } from "#/guards/is-guild-only.js";

import { UppyAutocompleteService } from "./interactions/uppy-autocomplete.service.js";
import { UppyInfoService } from "./interactions/uppy-info.service.js";
import { UppyRemainingService } from "./interactions/uppy-remaining.service.js";
import { UppyStatsService } from "./interactions/uppy-stats.service.js";
import { UppyLeaderboardService } from "./interactions/uppy-top.service.js";
import { BaseUppyService } from "./uppy.service.js";

@Discord()
@singleton()
@SlashGroup({
  name: "uppy",
  description: "Команды хелперов",
  dmPermission: false,
})
@SlashGroup("uppy")
export class UppyController {
  constructor(
    @inject(UppyStatsService) private uppyStatsService: UppyStatsService,
    @inject(UppyLeaderboardService)
    private uppyTopService: UppyLeaderboardService,
    @inject(UppyRemainingService)
    private uppyRemainingService: UppyRemainingService,
    @inject(UppyInfoService) private uppyInfoService: UppyInfoService,
  ) {}

  @Slash({
    name: "remaining",
    description: "Время до команд",
  })
  @Guard(IsHelper, IsGuildUser(GuildOnly))
  remaining(interaction: ChatInputCommandInteraction) {
    return this.uppyRemainingService.handleRemainingCommand(interaction);
  }

  @Slash({
    name: "info",
    description: "Бамп статистика пользователя",
  })
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
      autocomplete:
        UppyAutocompleteService.handleTopAutocomplete.bind(BaseUppyService),
      required: false,
    })
    from: string,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "to",
      description: "До какой даты",
      autocomplete:
        UppyAutocompleteService.handleTopAutocomplete.bind(BaseUppyService),
      required: false,
    })
    to: string,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.uppyInfoService.handleInfoCommand(interaction, user, from, to);
  }

  @Slash({
    name: "top",
    description: "Топ сотрудников",
  })
  @Guard(IsHelper, IsGuildUser(GuildOnly))
  uppyTopSlash(
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "from",
      description: "От какой даты",
      autocomplete:
        UppyAutocompleteService.handleTopAutocomplete.bind(BaseUppyService),
      required: false,
    })
    from: string,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "to",
      description: "До какой даты",
      autocomplete:
        UppyAutocompleteService.handleTopAutocomplete.bind(BaseUppyService),
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
    description: "История выполненных команд",
    name: "history",
  })
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
