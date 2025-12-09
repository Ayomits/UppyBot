import type { WebhookNotification } from "#/shared/webhooks/webhook.types.js";

export type WebhookCreatedPayload<T> = {
  url: string;
  data: WebhookNotification<T>;
  internal?: boolean;
  token: string;
};
