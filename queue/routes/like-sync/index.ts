import { discordClient } from "#/discord/client.js";
import { WebLikeSyncManager } from "#/discord/loops/like.js";
import { QueueMessages } from "#/queue/const/index.js";
import { createRoute } from "#/queue/utils/create-route.js";

import type { LikeSyncPayload } from "./types.js";

export const likeSyncRoute = createRoute<LikeSyncPayload>({
  queue: QueueMessages.like.sync,
  async consumeCallback(msg) {
    const payload = JSON.parse(msg.content.toString()) as LikeSyncPayload;
    const likeSyncManager = WebLikeSyncManager.create();
    await likeSyncManager.syncGuildLikes(
      discordClient.guilds.cache.get(payload.guildId)
    );
  },
});
