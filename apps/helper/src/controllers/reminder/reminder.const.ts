import type { LiteralEnum } from "@fear/utils";
import { blockQuote } from "discord.js";

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

export const RemindType = {
  DiscordMonitoring: 0,
  ServerMonitoring: 1,
  SdcMonitoring: 2,
} as const;

export type RemindType = LiteralEnum<typeof RemindType>;

export const MonitoringCommand = {
  DiscordMonitoring: "/like",
  ServerMonitoring: "/bump",
  SdcMonitoring: "/up",
} as const;

export type MonitoringCommand = LiteralEnum<typeof MonitoringCommand>;

export function getRemindTypeText(type: RemindType) {
  switch (type) {
    case RemindType.DiscordMonitoring:
      return "Discord monitoring (/like)";
    case RemindType.SdcMonitoring:
      return "SDC Monitoring (/up)";
    case RemindType.ServerMonitoring:
      return "Server Monitoring(/bump)";
  }
}

export function getCommandByRemindType(type: RemindType) {
  switch (type) {
    case RemindType.DiscordMonitoring:
      return blockQuote(MonitoringCommand.DiscordMonitoring);
    case RemindType.SdcMonitoring:
      return blockQuote(MonitoringCommand.SdcMonitoring);
    case RemindType.ServerMonitoring:
      return blockQuote(MonitoringCommand.ServerMonitoring);
  }
}

export function getBotByRemindType(type: RemindType) {
  switch (type) {
    case RemindType.DiscordMonitoring:
      return MonitoringBot.DiscordMonitoring;
    case RemindType.SdcMonitoring:
      return MonitoringBot.SdcMonitoring;
    case RemindType.ServerMonitoring:
      return MonitoringBot.ServerMonitoring;
  }
}
export function getRemindTypeByBot(type: MonitoringBot) {
  switch (type) {
    case MonitoringBot.DiscordMonitoring:
      return RemindType.DiscordMonitoring;
    case MonitoringBot.SdcMonitoring:
      return RemindType.SdcMonitoring;
    case MonitoringBot.ServerMonitoring:
      return RemindType.ServerMonitoring;
  }
}

export const DefaultTimezone = "Europe/Moscow";
