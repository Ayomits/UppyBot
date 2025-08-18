import { type ChatInputCommandInteraction } from "discord.js";
import { type ArgsOf, type Client, Discord, On, Slash } from "discordx";
import { inject, singleton } from "tsyringe";

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
    name: HelperBotMessages.remind.statusAll.command.name,
    description: HelperBotMessages.remind.statusAll.command.description,
  })
  reminderStatus(interaction: ChatInputCommandInteraction) {
    return this.reminderService.handleReminderStatus(interaction);
  }

  @On({ event: "ready" })
  onReady([client]: ArgsOf<"ready">) {
    return this.remindSchedule.initReminds(client as Client);
  }

  @On({ event: "messageCreate" })
  onMessageCreate([message]: ArgsOf<"messageCreate">) {
    return this.reminderHandler.handleCommand(message);
  }

  @On({ event: "messageUpdate" })
  onMessageUpdate([, message]: ArgsOf<"messageUpdate">) {
    return this.reminderHandler.handleCommand(message);
  }

  @On({ event: "guildMemberRemove" })
  onMemberRemove([oldMember]: ArgsOf<"guildMemberRemove">) {
    return this.remindSchedule.handleGuildRemove(oldMember);
  }
}
