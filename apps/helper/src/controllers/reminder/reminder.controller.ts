/* eslint-disable @typescript-eslint/no-unused-vars */
import { type ArgsOf, Discord, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { ReminderParser } from "./reminder.parser.js";
import { BumpReminderService } from "./reminder.service.js";

@Discord()
@singleton()
export class BumpReminderController {
  constructor(
    @inject(BumpReminderService)
    private reminderService: BumpReminderService,
  ) {}

  @On({ event: "messageCreate" })
  async onMessageCreate([message]: ArgsOf<"messageCreate">) {
    return this.reminderService.handleCommand(message);
  }

  @On({ event: "messageUpdate" })
  async onMessageUpdate([, message]: ArgsOf<"messageUpdate">) {
    return;
  }

  @On({ event: "guildMemberUpdate" })
  async onMemberUpdate([oldMember, newMember]: ArgsOf<"guildMemberUpdate">) {
    return;
  }

  @On({ event: "guildMemberRemove" })
  async onMemberRemove([oldMember, newMember]: ArgsOf<"guildMemberUpdate">) {
    return;
  }
}
