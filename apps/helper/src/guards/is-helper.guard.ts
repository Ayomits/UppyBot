import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import type { GuardFunction } from "discordx";

import { HelperBotMessages } from "#/messages/index.js";
import { SettingsModel } from "#/models/settings.model.js";

export const IsHelper: GuardFunction<ChatInputCommandInteraction> = async (
  interaction,
  _,
  next,
) => {
  const member = interaction.member as GuildMember;

  const settings = await SettingsModel.findOne(
    {
      guildId: interaction.guildId,
    },
    {},
    { upsert: true },
  );

  if (!settings || (settings && settings.bumpRoleIds.length === 0)) {
    return interaction.reply({
      content: HelperBotMessages.guards.isHelper.invalidSettings,
      ephemeral: true,
    });
  }

  if (member.roles.cache.some((r) => settings.bumpRoleIds.includes(r.id))) {
    return next();
  }

  return interaction.reply({
    content: HelperBotMessages.guards.isHelper.notHelper,
    ephemeral: true,
  });
};
