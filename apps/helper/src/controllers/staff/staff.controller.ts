import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type ChatInputCommandInteraction,
  type User,
  type UserContextMenuCommandInteraction,
} from "discord.js";
import { ContextMenu, Discord, Guard, Slash, SlashOption } from "discordx";
import { inject, singleton } from "tsyringe";

import { IsHelper } from "#/guards/is-helper.guard.js";
import { HelperBotMessages } from "#/messages/index.js";

import { StaffService } from "./staff.service.js";

@Discord()
@singleton()
export class StaffController {
  constructor(@inject(StaffService) private staffService: StaffService) {}

  @Slash({
    name: HelperBotMessages.staff.status.command.name,
    description: HelperBotMessages.staff.status.command.description,
  })
  @Guard(IsHelper)
  reminderStatus(interaction: ChatInputCommandInteraction) {
    return this.staffService.handleRemainingCommand(interaction);
  }

  @Slash({
    name: HelperBotMessages.staff.info.command.name,
    description: HelperBotMessages.staff.info.command.description,
  })
  @Guard(IsHelper)
  staffInfoSlash(
    @SlashOption({
      type: ApplicationCommandOptionType.User,
      name: HelperBotMessages.staff.info.command.args.user.name,
      description: HelperBotMessages.staff.info.command.args.user.description,
      required: false,
    })
    user: User,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: HelperBotMessages.staff.info.command.args.from.name,
      description: HelperBotMessages.staff.info.command.args.from.description,
      autocomplete: StaffService.handleInfoAutocomplete.bind(StaffService),
      required: false,
    })
    from: string,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: HelperBotMessages.staff.info.command.args.to.name,
      description: HelperBotMessages.staff.info.command.args.to.description,
      autocomplete: StaffService.handleInfoAutocomplete.bind(StaffService),
      required: false,
    })
    to: string,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.staffService.handleInfoCommand(interaction, user, from, to);
  }

  @Slash({
    name: HelperBotMessages.staff.top.command.name,
    description: HelperBotMessages.staff.top.command.description,
  })
  @Guard(IsHelper)
  staffTopSlash(
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: HelperBotMessages.staff.top.command.args.from.name,
      description: HelperBotMessages.staff.top.command.args.from.description,
      autocomplete: StaffService.handleInfoAutocomplete.bind(StaffService),
      required: false,
    })
    from: string,
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      name: HelperBotMessages.staff.top.command.args.to.name,
      description: HelperBotMessages.staff.top.command.args.to.description,
      autocomplete: StaffService.handleInfoAutocomplete.bind(StaffService),
      required: false,
    })
    to: string,
    interaction: ChatInputCommandInteraction,
  ) {
    return this.staffService.handleStaffTop(interaction, from, to);
  }

  @ContextMenu({
    name: HelperBotMessages.staff.info.context.name,
    type: ApplicationCommandType.User,
  })
  @Guard(IsHelper)
  staffInfoContext(interaction: UserContextMenuCommandInteraction) {
    return this.staffService.handleInfoCommand(interaction);
  }
}
