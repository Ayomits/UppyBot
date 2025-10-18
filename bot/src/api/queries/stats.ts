import { uppyRest } from "../utils/rest.js";

export async function findAllStats() {
  return await uppyRest.get<{
    guilds: number;
    reminds: number;
    commands: number;
  }>("/api/stats/all");
}
