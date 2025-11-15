import { fetchDiscordOauth2Guilds } from "#/shared/api/discord/index.js";
import { GuildModel } from "#/shared/db/models/uppy-discord/guild.model.js";
import type { NotificationUser } from "#/shared/db/models/uppy-telegram/user.model.js";

export async function getUserGuilds(
  accessToken: string,
  user?: NotificationUser
) {
  const discordGuilds = await fetchDiscordOauth2Guilds(accessToken);
  const guilds = discordGuilds.map((g) => g.id);
  const dbGuilds = await GuildModel.model.find({
    guildId: { $in: guilds },
    isActive: true,
  });

  const ids = dbGuilds.map((g) => g.guildId);

  const guildNames = Object.fromEntries(
    dbGuilds.map((g) => [g.guildId, g.guildName])
  );

  if (user) {
    return user.settings.selected_guilds
      .filter((g) => ids.includes(g))
      .map((g) => ({ id: g, name: guildNames[g] }));
  }
  return dbGuilds?.map((g) => ({ id: g.guildId, name: g.guildName })) ?? [];
}
