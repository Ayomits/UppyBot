import axios from "axios";

export const dsMonitoring = axios.create({
  baseURL: "https://discordserver.info",
});

export async function fetchServer(guildId: string) {
  return await dsMonitoring.get<string>(`/${guildId}`);
}
