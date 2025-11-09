import type { WebhookNotification } from "#/app/controllers/webhooks/webhook.types.js";

export type WebhookCreatedPayload<T> = {
  url: string;
  data: WebhookNotification<T>;
  token: string;
};
