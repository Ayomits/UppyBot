import { IsGuildUser } from "@discordx/utilities";
import { MessageFlags } from "discord.js";

import { GuildType } from "#/db/models/guild.model.js";
import { GuildRepository } from "#/db/repositories/guild.repository.js";

export const PremiumOnly = IsGuildUser(async ({ guild, arg }) => {
  const guildRepository = GuildRepository.create();
  const guildFromDb = await guildRepository.findGuild(guild!.id);

  if (guildFromDb!.type < GuildType.Premium) {
    // @ts-expect-error only interactions
    arg.reply({
      content: "Ваш сервер не имеет подписки",
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  return true;
});
