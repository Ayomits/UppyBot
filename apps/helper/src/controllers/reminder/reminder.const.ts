import type { LiteralEnum } from "@fear/utils";

export const MonitoringBot = {
  SdcMonitoring: "464272403766444044",
  ServerMonitoring: "315926021457051650",
  DiscordMonitoring: "575776004233232386",
} as const;

export type MonitoringBot = LiteralEnum<typeof MonitoringBot>;

export const MonitoringBotMessage = {
  serverMonitoring: {
    success: "Server bumped by",
    failure: "The next bump for this server will be available",
  },
  discordMonitoring: {
    success: [
      "Вы успешно лайкнули сервер",
      "You successfully liked the server",
    ],
    failure: ["You are so hot", "Не так быстро"],
  },
  sdcMonitoring: {
    success: "Успешный up",
    failure: "Не так быстро, сэр",
  },
} as const;
