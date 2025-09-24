import type { LiteralEnum } from "#/libs/utils/index.js";

export const BumpBanCheckerInterval = 15_000;
export const DiffCheckerInterval = 3_000;

export const DefaultTimezone = "Europe/Moscow";
export const MonitoringCooldownHours = 4;

// Изначально планировалось кнш делать это настройками
// Жопке айоми стало лень : )
export const BumpBanLimit = 5;

export const MonitoringBot = {
  SdcMonitoring: "464272403766444044",
  ServerMonitoring: "315926021457051650",
  DiscordMonitoring: "575776004233232386",
  DisboardMonitoring: "302050872383242240",
} as const;

export type MonitoringBot = LiteralEnum<typeof MonitoringBot>;

export const MonitoringBotMessage = {
  serverMonitoring: {
    success: "Server bumped by",
    failure: "The next Bump for this server will be available",
  },
  discordMonitoring: {
    success: [
      "Вы успешно лайкнули сервер",
      "You successfully liked the server",
      "Ви успішно лайкнули сервер",
    ],
    failure: ["You are so hot", "Не так быстро", "Не так швидко"],
  },
  sdcMonitoring: {
    success: "Время фиксации",
    failure: "Up",
  },
  disboardMonitoring: {
    success: "Bump done!",
    failure: "",
  },
} as const;

export const RemindType = {
  DiscordMonitoring: 0,
  ServerMonitoring: 1,
  SdcMonitoring: 2,
  DisboardMonitoring: 3,
} as const;

export type RemindType = LiteralEnum<typeof RemindType>;

export const MonitoringCommand = {
  DiscordMonitoring: "like",
  ServerMonitoring: "server_bump",
  DisboardMonitoring: "disboard_bump",
  SdcMonitoring: "up",
} as const;

export type MonitoringCommand = LiteralEnum<typeof MonitoringCommand>;

export const PointsRate = {
  [RemindType.DiscordMonitoring]: 1,
  [RemindType.SdcMonitoring]: 1,
  [RemindType.ServerMonitoring]: 2,
  night: 2,
} as const;

export function getCommandByRemindType(type: RemindType | number) {
  switch (type) {
    case RemindType.DiscordMonitoring:
      return MonitoringCommand.DiscordMonitoring;
    case RemindType.SdcMonitoring:
      return MonitoringCommand.SdcMonitoring;
    case RemindType.ServerMonitoring:
      return MonitoringCommand.ServerMonitoring;
    case RemindType.DisboardMonitoring:
      return MonitoringCommand.DisboardMonitoring;
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
