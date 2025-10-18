import { uppyRest } from "../utils/rest.js";

export async function syncGuilds(dto: { ids: string[] }) {
  return await uppyRest.post("/api/guilds/sync", dto);
}

export async function guildCreate(id: string) {
  return await uppyRest.post(`/api/guilds/${id}`);
}

export async function guildDelete(id: string) {
  return await uppyRest.delete(`/api/guilds/${id}`);
}
