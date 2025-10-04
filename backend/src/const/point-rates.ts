import { MonitoringType } from '#/enums/monitoring';

export const DefaultBonus = 1;

export const PointRate = {
  [MonitoringType.DiscordMonitoring]: {
    default: 1,
    bonus: DefaultBonus,
  },
  [MonitoringType.SdcMonitoring]: {
    default: 2,
    bonus: DefaultBonus,
  },
  [MonitoringType.ServerMonitoring]: {
    default: 3,
    bonus: DefaultBonus,
  },
  [MonitoringType.DisboardMonitoring]: {
    default: 2,
    bonus: DefaultBonus,
  },
} as const;
