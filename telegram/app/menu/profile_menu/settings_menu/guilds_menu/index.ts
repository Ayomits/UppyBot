import { Menu, MenuRange } from "@grammyjs/menu";

import { fetchDiscordOauth2Guilds } from "#/shared/api/discord/index.js";
import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";
import { chunkArray } from "#/shared/libs/json/chunk.js";
import { protectedInteraction } from "#/telegram/app/middlewares/protected-interaction.js";
import type { AppContext } from "#/telegram/utils/ctx.js";
import { Emojis } from "#/telegram/utils/emojis.js";

export const guildsMenuId = "guilds_menu";

export const guildsMenu = new Menu<AppContext>(guildsMenuId)
  .dynamic(async (ctx) => {
    const builder = new MenuRange<AppContext>();

    const userRepository = NotificationUserRepository.create();
    const user = await userRepository.findByTgId(ctx.from!.id);

    const cryptography = CryptographyService.create();

    const discordGuilds = await fetchDiscordOauth2Guilds(
      cryptography.decrypt(user!.tokens.access_token!)
    );

    let selectedGuilds = user?.settings.selected_guilds ?? [];
    const ids = selectedGuilds.map((g) => g.split("-")[0]);
    const hasGuild = (id: string) => ids.includes(id);
    const toFormat = (id: string, name: string) => `${id}-${name}`;

    for (const chunk of chunkArray(discordGuilds, 2)) {
      for (const guild of chunk) {
        builder.text(
          `${hasGuild(guild.id) ? Emojis.RED_CIRCLE : Emojis.GREEN_CIRCLE} ${guild.name}`,
          protectedInteraction,
          async (ctx) => {
            if (hasGuild(guild.id)) {
              selectedGuilds = selectedGuilds.filter(
                (g) => g !== toFormat(guild.id, guild.name)
              );
            } else {
              selectedGuilds.push(toFormat(guild.id, guild.name));
            }

            await userRepository.updateByTgId(ctx.from!.id, {
              [`settings.selected_guilds`]: selectedGuilds,
            });

            ctx.menu.update({
              immediate: true,
            });
          }
        );
      }
      builder.row();
    }

    return builder;
  })
  .back(`${Emojis.ARROW_LEFT} Назад`, protectedInteraction)
  .row();
