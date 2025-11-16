import { IsGuildUser } from "@discordx/utilities";
import { type ArgsOf, type Client, Discord, Guard, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { GuildOnly } from "#/discord/guards/is-guild-only.js";
import { likeSyncRoute } from "#/queue/routes/like-sync/index.js";

import { ReminderHandler } from "./reminder.handler.js";
import { ReminderScheduleManager } from "./reminder-schedule.manager.js";

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

  @On({ event: "guildCreate" })
  async onGuildCreate([guild]: ArgsOf<"guildCreate">) {
    likeSyncRoute.produce({ guildId: guild.id });
  }
}
