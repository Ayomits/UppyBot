import { type ArgsOf, type Client, Discord, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { ReminderHandler } from "./reminder.handler.js";
import { ReminderSchedule } from "./reminder.schedule.js";

@Discord()
@singleton()
export class BumpReminderController {
  constructor(
    @inject(ReminderHandler)
    private reminderHandler: ReminderHandler,
    @inject(ReminderSchedule) private remindSchedule: ReminderSchedule,
  ) {}

  reminderStatus() {}

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
