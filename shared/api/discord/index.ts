import type { AxiosResponse } from "axios";
import axios, { AxiosError } from "axios";
import type { APIGuild, APIUser } from "discord.js";

import { DISCORD_URL } from "#/server/const/index.js";
import { useCachedQuery } from "#/shared/db/mongo.js";
import { Env } from "#/shared/libs/config/index.js";

const discordApi = axios.create({
  baseURL: DISCORD_URL,
});

discordApi.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

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

export async function fetchDiscordOauth2User(
  access_token: string,
  refresh_token: string
) {
  return await useCachedQuery(`discord-profile`, 60_000, async () => {
    const user = await fetchWithRefreshToken(
      async (token) =>
        await discordApi.get<APIUser>(`/api/users/@me`, {
          headers: {
            Authorization: `Bearer ${token ?? access_token}`,
          },
        }),
      refresh_token
    );

    return user;
  });
}

export async function fetchDiscordOauth2Guilds(
  access_token: string,
  refresh_token: string
) {
  return await useCachedQuery(
    `discord-user-guilds-${access_token}`,
    60_000,
    async () => {
      const guilds = await fetchWithRefreshToken(
        async (token) =>
          await discordApi.get<APIGuild[]>(`/api/users/@me/guilds`, {
            headers: {
              Authorization: `Bearer ${token ?? access_token}`,
            },
          }),
        refresh_token
      );

      return guilds;
    }
  );
}

export async function fetchWithRefreshToken(
  fn: (access_token?: string) => Promise<AxiosResponse>,
  refresh_token: string,
  tokens: Awaited<ReturnType<typeof fetchDiscordOauth2Tokens>> | null = null
) {
  try {
    const data = await fn(tokens?.data?.access_token);

    return {
      data: data.data,
      tokens: null,
    };
  } catch (err) {
    if (err instanceof AxiosError) {
      const params = new URLSearchParams({
        client_id: Env.DiscordClientId,
        client_secret: Env.DiscordClientSecret,
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      });
      const tokens = await fetchDiscordOauth2Tokens(params).catch(() => null);

      if (!tokens) {
        return {
          data: null,
          tokens: null,
        };
      }

      const data = await fn(tokens.data.access_token);

      return {
        data: data.data,
        tokens: tokens.data,
      };
    }
    return {
      data: null,
      tokens: null,
    };
  }
}
