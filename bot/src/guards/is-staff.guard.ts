import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { MessageFlags } from "discord.js";
import type { GuardFunction } from "discordx";

import { developers } from "#/const/owners.js";
import { SettingsRepository } from "#/db/repositories/settings.repository.js";

import { UppyGuardMessage } from "../app/messages/guard.message.js";

export const IsHelper: GuardFunction<ChatInputCommandInteraction> = async (
  interaction,
  _,
  next
) => {
  const member = interaction.member as GuildMember;

  if (developers.includes(member.id)) {
    return next();
  }

  const settingsRepository = SettingsRepository.create();
  const settings = await settingsRepository.findGuildSettings(interaction.guildId!);

  if (!settings || (settings && settings?.roles.staffRoles?.length === 0)) {
    return interaction.reply({
      content: UppyGuardMessage.isHelper.invalidSettings,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (
    member.roles.cache.some((r) => settings?.roles.staffRoles?.includes(r.id))
  ) {
    return next();
  }

  return interaction.reply({
    content: UppyGuardMessage.isHelper.notHelper,
    flags: MessageFlags.Ephemeral,
  });
};
