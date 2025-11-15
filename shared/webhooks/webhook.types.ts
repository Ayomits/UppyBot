import type { LiteralEnum } from "#/shared/libs/djs/types.js";

export const WebhookNotificationType = {
  Test: -1,
  CommandSuccess: 0,
  BumpBanCreation: 1,
  BumpBanRemoval: 2,
  Remind: 3,
  ForceRemind: 4,
} as const;

export type WebhookNotificationType = LiteralEnum<
  typeof WebhookNotificationType
>;

export type WebhookCommandSuccessNotification = {
  type: number;
  userId: string;
  channelId: string | null;
  executedAt: Date;
  points: number;
};

export type WebhookBumpBanNotification = {
  userId: string;
  executedAt: Date;
};

export type WebhookRemindNotication = {
  commandName: string;
  guildName: string;
  channelName: string;
  aproximatedNotificationUsers: string[];
  type: number;
};

export type WebhookNotification<T> = {
  guildId: string;
  type: number;
  data: T;
};
