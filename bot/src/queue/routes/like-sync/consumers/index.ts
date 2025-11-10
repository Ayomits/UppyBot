import { client } from "#/client.js";
import { logger } from "#/libs/logger/logger.js";
import { WebLikeSyncManager } from "#/loops/like.js";
import type { Consumer } from "#/queue/utils/types.js";

import type { LikeSyncPayload } from "../types.js";

export const likeSyncConsumer: Consumer = async (msg, ch) => {
  logger.log(`Like syncing task consumer started`);
  try {
    const payload = JSON.parse(msg.content.toString()) as LikeSyncPayload;

    const likeSyncManager = WebLikeSyncManager.create();
    await likeSyncManager.syncGuildLikes(
      client.guilds.cache.get(payload.guildId)
    );

    ch.ack(msg);
    logger.log(`Like syncing task consumer ended successfully`);
  } catch (err) {
    logger.error(err);
    ch.nack(msg, false, false);
    logger.log(`Like syncing task consumer failed`);
  }
};
