import { IsGuildUser } from "@discordx/utilities";
import { MessageFlags } from "discord.js";

import { GuildModel, GuildType } from "#/models/guild.model.js";

export const PremiumOnly = IsGuildUser(async ({ guild, arg }) => {
  const guildFromDb = await GuildModel.findOneAndUpdate(
    { guildId: guild?.id },
    {},
    { upsert: true }
  );

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
