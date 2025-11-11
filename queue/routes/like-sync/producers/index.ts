import { QueueMessages } from "#/queue/const/index.js";
import { publishMessage } from "#/queue/utils/publishMessage.js";

import type { LikeSyncPayload } from "../types.js";

export function likeSyncProduce(payload: LikeSyncPayload) {
  publishMessage(QueueMessages.like.sync, payload);
}
