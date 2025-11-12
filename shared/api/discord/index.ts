import axios from "axios";
import type { APIGuild, APIUser } from "discord.js";

import { DISCORD_URL } from "#/server/const/index.js";

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
  return await discordApi.get<APIUser>(`/api/users/@me`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
}

export async function fetchDiscordOauth2Guilds(access_token: string) {
  return await discordApi.get<APIGuild[]>(`/api/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
}
