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
    return this.bumpReminderService.handleMessageCreate(message);
  }

  @On({ event: "messageUpdate" })
  async onMessageUpdate([, message]: ArgsOf<"messageUpdate">) {
    return this.bumpReminderService.handleMessageUpdate(message);
  }

  @On({ event: "guildMemberUpdate" })
  async onMemberUpdate([oldMember, newMember]: ArgsOf<"guildMemberUpdate">) {
    return this.bumpReminderService.handleMemberUpdate(oldMember, newMember);
  }
}
