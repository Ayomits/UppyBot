import axios from "axios";
import type { APIGuild, APIUser } from "discord.js";

import { DISCORD_URL } from "#/server/const/index.js";
import { useCachedQuery } from "#/shared/db/mongo.js";

const discordApi = axios.create({
  baseURL: DISCORD_URL,
});

export async function fetchDiscordOauth2Tokens(params: URLSearchParams) {
  return await discordApi.post<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>(`/api/oauth2/token`, params.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}

export async function fetchDiscordOauth2User(access_token: string) {
  return await useCachedQuery(
    `discord-profile-${access_token}`,
    60_000,
    async () => {
      const user = await discordApi.get<APIUser>(`/api/users/@me`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      return user.data;
    },
  );
}

export async function fetchDiscordOauth2Guilds(access_token: string) {
  return await useCachedQuery(
    `discord-profile-guilds-${access_token}`,
    60_000,
    async () => {
      const guilds = await discordApi.get<APIGuild[]>(`/api/users/@me/guilds`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      return guilds.data;
    },
  );
}
