import { LiteralEnum } from '#/types/literal-enum';

export const MonitoringBot = {
  SdcMonitoring: '464272403766444044',
  ServerMonitoring: '315926021457051650',
  DiscordMonitoring: '575776004233232386',
  DisboardMonitoring: '302050872383242240',
} as const;

export type MonitoringBot = LiteralEnum<typeof MonitoringBot>;

export const MonitoringType = {
  DiscordMonitoring: 0,
  ServerMonitoring: 1,
  SdcMonitoring: 2,
  DisboardMonitoring: 3,
} as const;

export const MonitoringCommandIds = {
  DiscordMonitoring: '788801838828879933',
  ServerMonitoring: '956435492398841858',
  DisboardMonitoring: '947088344167366698',
  SdcMonitoring: '891377101494681660',
} as const;

export const MonitoringCommandNames = {
  DiscordMonitoring: 'like',
  ServerMonitoring: 'bump',
  DisboardMonitoring: 'bump',
  SdcMonitoring: 'up',
} as const;
