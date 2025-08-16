import type { LiteralEnum } from "@fear/utils";

export const MonitoringBot = {
  SdcMonitoring: "464272403766444044",
  ServerMonitoring: "315926021457051650",
  DiscordMonitoring: "575776004233232386",
} as const;

export type MonitoringBot = LiteralEnum<typeof MonitoringBot>;
