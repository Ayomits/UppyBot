import { registerLikeSyncConsumers } from "./like-sync/index.js";
import { registerRemindConsumers } from "./notifications/index.js";
import { registerWebhookConsumers } from "./webhooks/index.js";

export async function registerConsumers() {
  await registerRemindConsumers();
  await registerWebhookConsumers();
  await registerLikeSyncConsumers();
}
