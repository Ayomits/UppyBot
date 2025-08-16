/* eslint-disable @typescript-eslint/no-unused-vars */
import { type ArgsOf, Discord, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { BumpReminderService } from "./bump-reminder.service.js";

@Discord()
@singleton()
export class BumpReminderController {
  constructor(
    @inject(BumpReminderService)
    private bumpReminderService: BumpReminderService,
  ) {}

  @On({ event: "messageCreate" })
  async onMessageCreate([message]: ArgsOf<"messageCreate">) {
    return;
  }

  @On({ event: "messageUpdate" })
  async onMessageUpdate([, message]: ArgsOf<"messageUpdate">) {
    return;
  }

  @On({ event: "guildMemberUpdate" })
  async onMemberUpdate([oldMember, newMember]: ArgsOf<"guildMemberUpdate">) {
    return;
  }
}
