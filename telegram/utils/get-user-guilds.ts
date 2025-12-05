import { GuildModel } from "#/shared/db/models/uppy-discord/guild.model.js";
import type { NotificationUser } from "#/shared/db/models/uppy-telegram/user.model.js";

import { getDiscordUserGuilds } from "./get-discord-user-data.js";

export async function getUserGuilds(user: NotificationUser | number) {
  const discordGuilds = await getDiscordUserGuilds(user!);
  const guilds = discordGuilds?.discord?.data?.map((g) => g.id) ?? [];
  const dbGuilds = await GuildModel.model.find({
    guildId: { $in: guilds },
    isActive: true,
  });

  const ids = dbGuilds.map((g) => g.guildId);

  const guildNames = Object.fromEntries(
    dbGuilds.map((g) => [g.guildId, g.guildName]),
  );

  if (user && typeof user !== "number") {
    return {
      ...discordGuilds,
      guilds: user?.settings.selected_guilds
        .filter((g) => ids.includes(g))
        .map((g) => ({ id: g, name: guildNames[g] })),
    };
  }

  return {
    ...discordGuilds,
    guilds: dbGuilds?.map((g) => ({ id: g.guildId, name: g.guildName })),
  };
}
