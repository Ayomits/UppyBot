import type { LiteralEnum } from "#/libs/djs/types.js";

export const WebhookNotificationType = {
  Test: -1,
  CommandSuccess: 0,
  BumpBanCreation: 1,
  BumpBanRemoval: 2,
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

export type WebhookNotification<T> = {
  type: WebhookNotificationType;
  data: T;
};
