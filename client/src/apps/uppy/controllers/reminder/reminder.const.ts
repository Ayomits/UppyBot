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

export const MonitoringCommandIds = {
  DiscordMonitoring: "788801838828879933",
  ServerMonitoring: "956435492398841858",
  DisboardMonitoring: "947088344167366698",
  SdcMonitoring: "891377101494681660",
} as const;

export const MonitoringCommandNames = {
  DiscordMonitoring: "like",
  ServerMonitoring: "bump",
  DisboardMonitoring: "bump",
  SdcMonitoring: "up",
} as const;

export type MonitoringCommandIds = LiteralEnum<typeof MonitoringCommandIds>;

export const PointsRate = {
  [RemindType.DiscordMonitoring]: 1,
  [RemindType.SdcMonitoring]: 1,
  [RemindType.ServerMonitoring]: 2,
  [RemindType.DisboardMonitoring]: 2,
  night: 2,
} as const;

export function getCommandIdByRemindType(type: RemindType | number) {
  switch (type) {
    case RemindType.DiscordMonitoring:
      return MonitoringCommandIds.DiscordMonitoring;
    case RemindType.SdcMonitoring:
      return MonitoringCommandIds.SdcMonitoring;
    case RemindType.ServerMonitoring:
      return MonitoringCommandIds.ServerMonitoring;
    case RemindType.DisboardMonitoring:
      return MonitoringCommandIds.DisboardMonitoring;
  }
}

export function getCommandNameByRemindType(type: RemindType | number) {
  switch (type) {
    case RemindType.DiscordMonitoring:
      return MonitoringCommandNames.DiscordMonitoring;
    case RemindType.SdcMonitoring:
      return MonitoringCommandNames.SdcMonitoring;
    case RemindType.ServerMonitoring:
      return MonitoringCommandNames.ServerMonitoring;
    case RemindType.DisboardMonitoring:
      return MonitoringCommandNames.DisboardMonitoring;
  }
}

export function getCommandNameByCommandId(id: MonitoringCommandIds | string) {
  switch (id) {
    case MonitoringCommandIds.DiscordMonitoring:
      return MonitoringCommandNames.DiscordMonitoring;
    case MonitoringCommandIds.SdcMonitoring:
      return MonitoringCommandNames.SdcMonitoring;
    case MonitoringCommandIds.ServerMonitoring:
      return MonitoringCommandNames.ServerMonitoring;
    case MonitoringCommandIds.DisboardMonitoring:
      return MonitoringCommandNames.DisboardMonitoring;
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
    case RemindType.DisboardMonitoring:
      return MonitoringBot.DisboardMonitoring;
  }
}

export function getBotByCommand(cmd: MonitoringCommandIds) {
  switch (cmd) {
    case MonitoringCommandIds.DiscordMonitoring:
      return MonitoringBot.DiscordMonitoring;
    case MonitoringCommandIds.SdcMonitoring:
      return MonitoringBot.SdcMonitoring;
    case MonitoringCommandIds.ServerMonitoring:
      return MonitoringBot.ServerMonitoring;
    case MonitoringCommandIds.DisboardMonitoring:
      return MonitoringBot.DisboardMonitoring;
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
    case MonitoringBot.DisboardMonitoring:
      return RemindType.DisboardMonitoring;
  }
}
