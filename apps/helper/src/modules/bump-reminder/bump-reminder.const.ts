import type { LiteralEnum } from "@ts-fetcher/types";

export const MonitoringBot = {
  SdcMonitoring: "464272403766444044",
  ServerMonitoring: "315926021457051650",
  DiscordMonitoring: "575776004233232386",
} as const;

export type MonitoringBot = LiteralEnum<typeof MonitoringBot>;
