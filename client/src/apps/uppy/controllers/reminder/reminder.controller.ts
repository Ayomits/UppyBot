import { IsGuildUser } from "@discordx/utilities";
import { type ArgsOf, type Client, Discord, Guard, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { GuildOnly } from "#/guards/is-guild-only.js";

import { ReminderHandler } from "./reminder.handler.js";
import { RemindBumpBanManager } from "./reminder-bump-ban.manager.js";
import { ReminderScheduleManager } from "./reminder-schedule.manager.js";

@Discord()
@singleton()
export class BumpReminderController {
  constructor(
    @inject(ReminderHandler)
    private reminderHandler: ReminderHandler,
    @inject(ReminderScheduleManager)
    private remindSchedule: ReminderScheduleManager,
    @inject(RemindBumpBanManager) private bumpBanManager: RemindBumpBanManager,
  ) {}

  @On({ event: "ready" })
  onReady([client]: ArgsOf<"ready">) {
    this.remindSchedule.initReminds(client as Client);
    this.bumpBanManager.initBumpBan(client as Client);
  }

  @On({ event: "messageCreate" })
  @Guard(IsGuildUser(GuildOnly))
  onMessageCreate([message]: ArgsOf<"messageCreate">) {
    return this.reminderHandler.handleCommand(message);
  }

  @On({ event: "messageUpdate" })
  @Guard(IsGuildUser(GuildOnly))
  onMessageUpdate([, message]: ArgsOf<"messageUpdate">) {
    return this.reminderHandler.handleCommand(message);
  }
}
