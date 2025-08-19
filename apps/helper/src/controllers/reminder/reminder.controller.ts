import { type ChatInputCommandInteraction } from "discord.js";
import { type ArgsOf, type Client, Discord, Guard, On, Slash } from "discordx";
import { inject, singleton } from "tsyringe";

import { IsHelper } from "#/guards/is-helper.guard.js";
import { HelperBotMessages } from "#/messages/index.js";

import { ReminderHandler } from "./reminder.handler.js";
import { ReminderScheduleManager } from "./reminder.schedule-manager.js";
import { ReminderService } from "./reminder.service.js";

@Discord()
@singleton()
export class BumpReminderController {
  constructor(
    @inject(ReminderHandler)
    private reminderHandler: ReminderHandler,
    @inject(ReminderScheduleManager)
    private remindSchedule: ReminderScheduleManager,
    @inject(ReminderService) private reminderService: ReminderService,
  ) {}

  @Slash({
    name: HelperBotMessages.staff.status.command.name,
    description: HelperBotMessages.staff.status.command.description,
  })
  @Guard(IsHelper)
  reminderStatus(interaction: ChatInputCommandInteraction) {
    return this.reminderService.handleReminderStatus(interaction);
  }

  @On({ event: "ready" })
  onReady([client]: ArgsOf<"ready">) {
    this.remindSchedule.initReminds(client as Client);
    this.remindSchedule.initBumpBan(client as Client);
  }

  @On({ event: "messageCreate" })
  onMessageCreate([message]: ArgsOf<"messageCreate">) {
    return this.reminderHandler.handleCommand(message);
  }

  @On({ event: "messageUpdate" })
  onMessageUpdate([, message]: ArgsOf<"messageUpdate">) {
    return this.reminderHandler.handleCommand(message);
  }
}
