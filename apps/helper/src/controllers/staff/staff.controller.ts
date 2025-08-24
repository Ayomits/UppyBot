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

import { RemindType } from "#/controllers/reminder/reminder.const.js";
import { IsHelper } from "#/guards/is-helper.guard.js";

import { StaffService } from "./staff.service.js";

@Discord()
@singleton()
@SlashGroup({ name: "helper", description: "Команды хелперов" })
@SlashGroup("helper")
export class StaffController {
  constructor(@inject(StaffService) private staffService: StaffService) {}

  @Slash({
    name: "remaining",
    description: "Время до команд",
  })
  @Guard(IsHelper)
  reminderStatus(interaction: ChatInputCommandInteraction) {
    return this.staffService.handleRemainingCommand(interaction);
  }

  @Slash({
    name: "info",
    description: "Бамп статистика пользователя",
  })
  @Guard(IsHelper)
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
      autocomplete: StaffService.handleInfoAutocomplete.bind(StaffService),
      required: false,
    })
    from: string,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "to",
      description: "До какой даты",
      autocomplete: StaffService.handleInfoAutocomplete.bind(StaffService),
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
  @Guard(IsHelper)
  staffTopSlash(
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "from",
      description: "От какой даты",
      autocomplete: StaffService.handleInfoAutocomplete.bind(StaffService),
      required: false,
    })
    from: string,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: "to",
      description: "До какой даты",
      autocomplete: StaffService.handleInfoAutocomplete.bind(StaffService),
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
  @Guard(IsHelper)
  staffInfoContext(interaction: UserContextMenuCommandInteraction) {
    return this.staffService.handleInfoCommand(interaction);
  }

  @Slash({
    description: "История выполненных команд",
    name: "history",
  })
  @Guard(IsHelper)
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
