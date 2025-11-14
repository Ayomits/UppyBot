import { Menu, MenuRange } from "@grammyjs/menu";

import { fetchDiscordOauth2Guilds } from "#/shared/api/discord/index.js";
import { GuildCollectionName } from "#/shared/db/models/uppy-discord/guild.model.js";
import { mainMongoConnection } from "#/shared/db/mongo.js";
import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";
import { chunkArray } from "#/shared/libs/json/chunk.js";
import { createMainProfileMessage } from "#/telegram/app/messages/main-profile.message.js";
import { protectedInteraction } from "#/telegram/app/middlewares/protected-interaction.js";
import type { AppContext } from "#/telegram/utils/ctx.js";
import { Emojis } from "#/telegram/utils/emojis.js";

export const guildsMenuId = "guilds_menu";

async function getBotBasedGuilds(guilds: string[]) {
  const dbGuilds = await mainMongoConnection
    ?.collection(GuildCollectionName)
    .find({ guildId: { $in: guilds }, isActive: true })
    .toArray();

  return dbGuilds?.map((g) => ({ id: g.guildId, name: g.guildName })) ?? [];
}

export const guildsMenu = new Menu<AppContext>(guildsMenuId)
  .dynamic(async (ctx) => {
    const builder = new MenuRange<AppContext>();

    const userRepository = NotificationUserRepository.create();
    const user = await userRepository.findByTgId(ctx.from!.id);

    const cryptography = CryptographyService.create();

    const discordGuilds = await fetchDiscordOauth2Guilds(
      cryptography.decrypt(user!.tokens.access_token!),
    );

    let selectedGuilds = user?.settings.selected_guilds ?? [];
    const ids = selectedGuilds.map((g) => g.split("-")[0]);
    const hasGuild = (id: string) => ids.includes(id);
    const toFormat = (id: string, name: string) => `${id}-${name}`;

    const guilds = await getBotBasedGuilds(discordGuilds.map((g) => g.id));

    for (const chunk of chunkArray(guilds, 2)) {
      for (const guild of chunk) {
        builder.text(
          `${hasGuild(guild.id) ? Emojis.RED_CIRCLE : Emojis.GREEN_CIRCLE} ${guild.name}`,
          protectedInteraction,
          async (ctx) => {
            if (hasGuild(guild.id)) {
              selectedGuilds = selectedGuilds.filter(
                (g) => g !== toFormat(guild.id, guild.name),
              );
            } else {
              selectedGuilds.push(toFormat(guild.id, guild.name));
            }

            const newUsr = await userRepository.updateByTgId(ctx.from!.id, {
              [`settings.selected_guilds`]: selectedGuilds,
            });

            const msg = await createMainProfileMessage(newUsr!);
            await ctx.editMessageCaption({
              caption: msg.text!,
              parse_mode: msg.parse_mode!,
            });
          },
        );
      }
      builder.row();
    }

    return builder;
  })
  .back(`${Emojis.ARROW_LEFT} Назад`, protectedInteraction)
  .row();
