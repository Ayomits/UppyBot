import type { GuildMember, Message, PartialGuildMember } from "discord.js";
import { inject, injectable } from "tsyringe";

import { BumpReminderRepository } from "#/db/repositories/bump-reminder.repository.js";
import { HelperRepository } from "#/db/repositories/helper.repository.js";

import { BumpReminderHandlerService } from "./bump-reminder-handler.service.js";

@injectable()
export class BumpReminderService {
  constructor(
    @inject(HelperRepository) private helperRepository: HelperRepository,
    @inject(BumpReminderHandlerService)
    private bumpReminderHandler: BumpReminderHandlerService,
    @inject(BumpReminderRepository)
    private bumpReminderRepository: BumpReminderRepository
  ) {}

  async handleMemberUpdate(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember
  ) {
    const bumpSettings =
      await this.bumpReminderRepository.findOrCreateByGuildId(
        newMember.guild.id
      );

    if (!bumpSettings || !bumpSettings.enable) return;

    const helperRoleId = bumpSettings.helperRoleID[0];

    const hadRole = oldMember.roles.cache.has(helperRoleId);
    const hasRole = newMember.roles.cache.has(helperRoleId);

    const existingEntry = await this.helperRepository.findByUserAndGuild(
      newMember.user.id,
      newMember.guild.id
    );

    if (!hadRole && hasRole && !existingEntry) {
      await this.helperRepository.createHelper({
        guildId: newMember.guild.id,
        userId: newMember.user.id,
      });
    }

    if (hadRole && !hasRole && existingEntry) {
      await this.helperRepository.deleteHelper({
        userId: newMember.user.id,
        guildId: newMember.guild.id,
      });
    }
  }

  async handleMessageCreate(message: Message) {
    return this.handleMessage(message);
  }

  async handleMessageUpdate(message: Message) {
    return this.handleMessage(message);
  }

  private async handleMessage(message: Message) {
    if (!message.author) return;
    await this.bumpReminderHandler.handleMonitoringMessage(message);
  }
}
