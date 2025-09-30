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
  SlashChoice,
  SlashGroup,
  SlashOption,
} from "discordx";
import { inject, singleton } from "tsyringe";

import { RemindType } from "#/apps/uppy/controllers/reminder/reminder.const.js";
import { IsHelper } from "#/apps/uppy/guards/is-helper.guard.js";
import { GuildOnly } from "#/guards/is-guild-only.js";

import { StaffService } from "./staff.service.js";

@Discord()
@singleton()
@SlashGroup({
  name: "uppy",
  description: "Команды хелперов",
  dmPermission: false,
})
@SlashGroup("uppy")
export class StaffController {
  constructor(@inject(StaffService) private staffService: StaffService) {}

  @Slash({
    name: "remaining",
    description: "Время до команд",
  })
  @Guard(IsHelper, IsGuildUser(GuildOnly))
  reminderStatus(interaction: ChatInputCommandInteraction) {
    return this.staffService.handleRemainingCommand(interaction);
  }

  @Slash({
    name: "info",
    description: "Бамп статистика пользователя",
  })
  @Guard(IsHelper, IsGuildUser(GuildOnly))
  staffInfoSlash(
    @SlashOption({
      type: ApplicationCommandOptionType.User,
      name: "user",
      description: "Пользователь",
      required: false,
    })
    user: User,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "from",
      description: "От какой даты",
      autocomplete: StaffService.handleTopAutocomplete.bind(StaffService),
      required: false,
    })
    from: string,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "to",
      description: "До какой даты",
      autocomplete: StaffService.handleTopAutocomplete.bind(StaffService),
      required: false,
    })
    to: string,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.staffService.handleInfoCommand(interaction, user, from, to);
  }

  @Slash({
    name: "top",
    description: "Топ сотрудников",
  })
  @Guard(IsHelper, IsGuildUser(GuildOnly))
  staffTopSlash(
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "from",
      description: "От какой даты",
      autocomplete: StaffService.handleTopAutocomplete.bind(StaffService),
      required: false,
    })
    from: string,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "to",
      description: "До какой даты",
      autocomplete: StaffService.handleTopAutocomplete.bind(StaffService),
      required: false,
    })
    to: string,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.staffService.handleTopCommand(interaction, from, to);
  }

  @ContextMenu({
    name: "Статистика пользователя",
    type: ApplicationCommandType.User,
  })
  @Guard(IsHelper, IsGuildUser(GuildOnly))
  staffInfoContext(interaction: UserContextMenuCommandInteraction) {
    return this.staffService.handleInfoCommand(
      interaction,
      interaction.targetUser,
    );
  }

  @Slash({
    description: "История выполненных команд",
    name: "history",
  })
  @Guard(IsHelper, IsGuildUser(GuildOnly))
  staffStats(
    @SlashChoice(
      ...[
        {
          name: "По команде up",
          value: RemindType.SdcMonitoring,
        },
        {
          name: "По команде bump",
          value: RemindType.ServerMonitoring,
        },
        {
          name: "По команде like",
          value: RemindType.DiscordMonitoring,
        },
      ],
    )
    @SlashOption({
      name: "field",
      description: "Поле для просмотра",
      required: false,
      type: ApplicationCommandOptionType.Number,
    })
    field: number,
    @SlashOption({
      type: ApplicationCommandOptionType.User,
      name: "user",
      description: "Пользователь",
      required: false,
    })
    user: User,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.staffService.handleStatsCommand(interaction, user, field);
  }
}
