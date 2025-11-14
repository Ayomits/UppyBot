import axios from "axios";

import { Env } from "#/shared/libs/config/index.js";

export const uppyApi = axios.create({
  baseURL: Env.UppyUrl,
});

export async function fetchOauth2UppyUrl(chatId: number, token: string) {
  return await uppyApi.get<{ url: string }>("/discord/login", {
    params: {
      chat_id: chatId,
      token,
    },
  });
}
