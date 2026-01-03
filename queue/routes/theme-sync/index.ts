import { DiscordAPIError } from "discord.js";

import { AvatarService } from "#/discord/app/premium/theming/avatar.service.js";
import { BannerService } from "#/discord/app/premium/theming/banner.service.js";
import { discordClient } from "#/discord/client.js";
import { AppThemes } from "#/discord/const/themes.js";
import { QueueMessages } from "#/queue/const/index.js";
import { createRoute } from "#/queue/utils/create-route.js";
import { parseConsumerData } from "#/queue/utils/parse-data.js";
import { GuildRepository } from "#/shared/db/repositories/uppy-discord/guild.repository.js";
import { sum } from "#/shared/libs/number/index.js";
import { sleep } from "#/shared/libs/time/sleep.js";
import { Time } from "#/shared/libs/time/time.js";

import type { ThemeSyncPayload } from "./types.js";

export const themeSyncRoute = createRoute<ThemeSyncPayload>({
  queue: QueueMessages.theme.sync,
  async consumeCallback(msg) {
    const data = parseConsumerData<ThemeSyncPayload>(msg);

    const bannerService = BannerService.create();
    const avatarService = AvatarService.create();

    const guildRepository = GuildRepository.create();

    const memberCount = sum(
      ...discordClient.guilds.cache.map((g) => g.memberCount),
    );
    const serversCount = await guildRepository.count({ isActive: true });
    const guild = await discordClient.guilds
      .fetch(data.guildId)
      .catch(() => null);

    if (!guild) {
      return;
    }

    async function edit(field: string, value: Buffer) {
      await guild?.members
        .editMe({
          [field]: data.theme !== AppThemes.Green ? value : null,
        })
        .catch(async (err) => {
          if (err instanceof DiscordAPIError) {
            if (err.code === 50035) {
              await sleep(Time.minute * 1.5);
              edit(field, value);
            }
          }
        });
    }

    if (!data.hasBanner) {
      await edit(
        "banner",
        await bannerService.draw({
          theme: data.theme,
          memberCount,
          serversCount,
        }),
      );
    }

    if (!data.hasAvatar) {
      await edit(
        "avatar",
        await avatarService.draw({
          theme: data.theme,
        }),
      );
    }
  },
});

export const themeSyncGlobal = createRoute({
  async consumeCallback() {
    const bannerService = BannerService.create();
    const avatarService = AvatarService.create();
    const guildRepository = GuildRepository.create();

    const memberCount = sum(
      ...discordClient.guilds.cache.map((g) => g.memberCount),
    );
    const serversCount = await guildRepository.count({ isActive: true });

    const options = {
      avatar: await avatarService.draw({ theme: AppThemes.Green }),
      banner: await bannerService.draw({
        theme: AppThemes.Green,
        memberCount,
        serversCount,
      }),
    };

    await discordClient.user?.edit(options).catch(async (err) => {
      console.error(err);
      if (err instanceof DiscordAPIError) {
        if (err.code === 50035) {
          await sleep(Time.minute * 1.5);
          await discordClient.user?.edit(options);
        }
      }
    });
  },
  queue: QueueMessages.theme.syncGlobal,
});
