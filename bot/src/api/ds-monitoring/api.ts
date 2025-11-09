import axios from "axios";

export const dsMonitoring = axios.create({
  baseURL: "https://discordserver.info",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  },
});

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
];

dsMonitoring.interceptors.request.use((config) => {
  config.headers["User-Agent"] =
    userAgents[Math.floor(Math.random() * userAgents.length)];

  return config;
});

export async function fetchServer(guildId: string) {
  const response = await dsMonitoring.get<string>(`/${guildId}`);

  return response;
}
