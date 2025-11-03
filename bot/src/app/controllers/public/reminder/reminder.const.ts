import type { BumpUser } from "#/db/models/bump-user.model.js";
import type { LiteralEnum } from "#/libs/utils/index.js";

export const BumpBanCheckerInterval = 30_000;

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

export const MonitoringType = {
  DiscordMonitoring: 0,
  ServerMonitoring: 1,
  SdcMonitoring: 2,
  DisboardMonitoring: 3,
} as const;

export type MonitoringType = LiteralEnum<typeof MonitoringType>;

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
  [MonitoringType.DiscordMonitoring]: 1,
  [MonitoringType.SdcMonitoring]: 1,
  [MonitoringType.ServerMonitoring]: 2,
  [MonitoringType.DisboardMonitoring]: 2,
  night: 2,
} as const;

export function getCommandIdByRemindType(type: MonitoringType | number) {
  switch (type) {
    case MonitoringType.DiscordMonitoring:
      return MonitoringCommandIds.DiscordMonitoring;
    case MonitoringType.SdcMonitoring:
      return MonitoringCommandIds.SdcMonitoring;
    case MonitoringType.ServerMonitoring:
      return MonitoringCommandIds.ServerMonitoring;
    case MonitoringType.DisboardMonitoring:
      return MonitoringCommandIds.DisboardMonitoring;
  }
}

export function getCommandNameByRemindType(type: MonitoringType | number) {
  switch (type) {
    case MonitoringType.DiscordMonitoring:
      return MonitoringCommandNames.DiscordMonitoring;
    case MonitoringType.SdcMonitoring:
      return MonitoringCommandNames.SdcMonitoring;
    case MonitoringType.ServerMonitoring:
      return MonitoringCommandNames.ServerMonitoring;
    case MonitoringType.DisboardMonitoring:
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

export function getBotByRemindType(type: MonitoringType) {
  switch (type) {
    case MonitoringType.DiscordMonitoring:
      return MonitoringBot.DiscordMonitoring;
    case MonitoringType.SdcMonitoring:
      return MonitoringBot.SdcMonitoring;
    case MonitoringType.ServerMonitoring:
      return MonitoringBot.ServerMonitoring;
    case MonitoringType.DisboardMonitoring:
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
      return MonitoringType.DiscordMonitoring;
    case MonitoringBot.SdcMonitoring:
      return MonitoringType.SdcMonitoring;
    case MonitoringBot.ServerMonitoring:
      return MonitoringType.ServerMonitoring;
    case MonitoringBot.DisboardMonitoring:
      return MonitoringType.DisboardMonitoring;
  }
}

export function getFieldByRemindType(
  type: MonitoringType | number,
): keyof BumpUser | undefined {
  switch (type) {
    case MonitoringType.DiscordMonitoring:
      return "dsMonitoring";
    case MonitoringType.SdcMonitoring:
      return "sdcMonitoring";
    case MonitoringType.ServerMonitoring:
      return "serverMonitoring";
    case MonitoringType.DisboardMonitoring:
      return "disboardMonitoring";
  }
}
