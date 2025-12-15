import { DiscordAPIError } from "discord.js";

import { AvatarService } from "#/discord/app/theming/avatar.service.js";
import { BannerService } from "#/discord/app/theming/banner.service.js";
import { discordClient } from "#/discord/client.js";
import { AppThemes } from "#/discord/const/themes.js";
import { QueueMessages } from "#/queue/const/index.js";
import { createRoute } from "#/queue/utils/create-route.js";
import { parseConsumerData } from "#/queue/utils/parse-data.js";
import { redis, redisClient } from "#/shared/db/redis.js";
import { GuildRepository } from "#/shared/db/repositories/uppy-discord/guild.repository.js";
import { sum } from "#/shared/libs/number/index.js";
import { sleep } from "#/shared/libs/time/sleep.js";
import { Time } from "#/shared/libs/time/time.js";

import type { ThemeSyncPayload } from "./types.js";

const TASK_PREFIX = "theme-sync:";
const TASK_TTL_MS = 10 * 60;

async function tryAcquireTask(
  guildId: string,
  version: number
): Promise<boolean> {
  const key = `${TASK_PREFIX}${guildId}`;
  const current = await redisClient.get(key);

  if (!current || parseInt(current) < version) {
    await redis.set(key, version.toString(), "PX", TASK_TTL_MS);
    return true;
  }

  return false;
}

async function isTaskCurrent(
  guildId: string,
  version: number
): Promise<boolean> {
  const key = `${TASK_PREFIX}${guildId}`;
  const current = await redisClient.get(key);
  return !!current && parseInt(current) === version;
}

async function releaseTask(guildId: string): Promise<void> {
  const key = `${TASK_PREFIX}${guildId}`;
  await redisClient.del(key);
}

export const themeSyncRoute = createRoute<ThemeSyncPayload>({
  queue: QueueMessages.theme.sync,
  queueOpts: {
    durable: true,
    autoDelete: false,
  },
  async consumeCallback(msg) {
    const data = parseConsumerData<ThemeSyncPayload & { __version?: number }>(
      msg
    );
    const taskVersion = data.__version || Date.now();

    const acquired = await tryAcquireTask(data.guildId, taskVersion);

    if (!acquired) {
      return;
    }

    try {
      const checkCancelled = async () => {
        const isCurrent = await isTaskCurrent(data.guildId, taskVersion);
        if (!isCurrent) throw new Error("CANCELLED_BY_NEWER");
      };

      await checkCancelled();

      const bannerService = BannerService.create();
      const avatarService = AvatarService.create();
      const guildRepository = GuildRepository.create();

      const memberCount = sum(
        ...discordClient.guilds.cache.map((g) => g.memberCount)
      );
      const serversCount = await guildRepository.count({ isActive: true });

      await checkCancelled();

      const guild = await discordClient.guilds
        .fetch(data.guildId)
        .catch(() => null);
      if (!guild) {
        await releaseTask(data.guildId);
        return;
      }

      async function edit(field: string, value: Buffer, attempt = 0) {
        await checkCancelled();

        try {
          await guild!.members.editMe({
            [field]: data.theme !== AppThemes.Green ? value : null,
          });
        } catch (err) {
          if (
            err instanceof DiscordAPIError &&
            err.code === 50035 &&
            attempt < 3
          ) {
            await sleep(Time.minute * 1.5);
            await edit(field, value, attempt + 1);
          } else {
            throw err;
          }
        }
      }

      if (!data.hasBanner) {
        await checkCancelled();
        await edit(
          "banner",
          await bannerService.draw({
            theme: data.theme,
            memberCount,
            serversCount,
          })
        );
      }

      if (!data.hasAvatar) {
        await checkCancelled();
        await edit("avatar", await avatarService.draw({ theme: data.theme }));
      }

      await releaseTask(data.guildId);
    } catch (error) {
      if (error.message === "CANCELLED_BY_NEWER") {
        return;
      } else {
        await releaseTask(data.guildId);
        throw new Error();
      }
    }
  },
});

const GLOBAL_TASK_KEY = "theme-sync:global";

async function tryAcquireGlobalTask(version: number): Promise<boolean> {
  const current = await redisClient.get(GLOBAL_TASK_KEY);

  if (!current || parseInt(current) < version) {
    await redis.set(GLOBAL_TASK_KEY, version.toString(), "PX", TASK_TTL_MS);
    return true;
  }

  return false;
}

async function isGlobalTaskCurrent(version: number): Promise<boolean> {
  const current = await redisClient.get(GLOBAL_TASK_KEY);
  return !!current && parseInt(current) === version;
}

export const themeSyncGlobal = createRoute({
  async consumeCallback() {
    const taskVersion = Date.now();

    const acquired = await tryAcquireGlobalTask(taskVersion);

    if (!acquired) {
      return;
    }

    try {
      const checkCancelled = async () => {
        const isCurrent = await isGlobalTaskCurrent(taskVersion);
        if (!isCurrent) throw new Error("CANCELLED_BY_NEWER");
      };

      await checkCancelled();

      const bannerService = BannerService.create();
      const avatarService = AvatarService.create();
      const guildRepository = GuildRepository.create();

      const memberCount = sum(
        ...discordClient.guilds.cache.map((g) => g.memberCount)
      );
      const serversCount = await guildRepository.count({ isActive: true });

      await checkCancelled();

      const options = {
        avatar: await avatarService.draw({ theme: AppThemes.Green }),
        banner: await bannerService.draw({
          theme: AppThemes.Green,
          memberCount,
          serversCount,
        }),
      };

      await checkCancelled();

      await discordClient.user?.edit(options).catch(async (err) => {
        if (err instanceof DiscordAPIError) {
          if (err.code === 50035) {
            await sleep(Time.minute * 1.5);
            await discordClient.user?.edit(options);
          }
        }
      });

      await redisClient.del(GLOBAL_TASK_KEY);
    } catch (error) {
      if (error.message !== "CANCELLED_BY_NEWER") {
        await redisClient.del(GLOBAL_TASK_KEY);
        return;
      }
      throw error;
    }
  },
  queue: QueueMessages.theme.syncGlobal,
});
