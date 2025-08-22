import { type ArgsOf, type Client, Discord, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { ReminderHandler } from "./reminder.handler.js";
import { ReminderScheduleManager } from "./reminder.schedule-manager.js";

@Discord()
@singleton()
export class BumpReminderController {
  constructor(
    @inject(ReminderHandler)
    private reminderHandler: ReminderHandler,
    @inject(ReminderScheduleManager)
    private remindSchedule: ReminderScheduleManager,
  ) {}

  @On({ event: "ready" })
  onReady([client]: ArgsOf<"ready">) {
    this.remindSchedule.initReminds(client as Client);
    // this.remindSchedule.initBumpBan(client as Client);
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
