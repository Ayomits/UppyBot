import { telegramNotificationRoute } from "#/queue/routes/telegram-notification/index.js";
import {
  fetchDiscordOauth2Guilds,
  fetchDiscordOauth2User,
} from "#/shared/api/discord/index.js";
import type { NotificationUser } from "#/shared/db/models/uppy-telegram/user.model.js";
import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";

export async function getDiscordUser(data: number | NotificationUser) {
  const userRepository = NotificationUserRepository.create();
  const telegramId = typeof data === "number" ? data : data.telegram_user_id;
  let user =
    typeof data === "number"
      ? await userRepository.findByTgId(telegramId)
      : data;

  const cryptography = CryptographyService.create();
  const discord = await fetchDiscordOauth2User(
    cryptography.decrypt(user.tokens.access_token),
    cryptography.decrypt(user.tokens.refresh_token),
  );

  if (discord?.tokens) {
    user = await userRepository.updateByTgId(telegramId, {
      "tokens.access_token": cryptography.encrypt(discord.tokens?.access_token),
      "tokens.refresh_token": cryptography.encrypt(
        discord.tokens?.refresh_token,
      ),
    });
  }

  if (!discord.data && !discord.tokens) {
    user = await userRepository.updateByTgId(telegramId, {
      tokens: {
        access_token: null,
        refresh_token: null,
      },
      discord_user_id: null,
    });
  }

  return {
    user,
    discord,
  };
}

export async function getDiscordUserGuilds(data: number | NotificationUser) {
  const userRepository = NotificationUserRepository.create();
  const telegramId = typeof data === "number" ? data : data.telegram_user_id;
  let user =
    typeof data === "number"
      ? await userRepository.findByTgId(telegramId)
      : data;

  const cryptography = CryptographyService.create();
  const discord = await fetchDiscordOauth2Guilds(
    cryptography.decrypt(user.tokens.access_token),
    cryptography.decrypt(user.tokens.refresh_token),
  );

  if (discord?.tokens) {
    user = await userRepository.updateByTgId(telegramId, {
      "tokens.access_token": cryptography.encrypt(discord.tokens.access_token),
      "tokens.refresh_token": cryptography.encrypt(
        discord.tokens.refresh_token,
      ),
    });
  }

  if (!discord.data && !discord.tokens) {
    user = await userRepository.updateByTgId(telegramId, {
      tokens: {
        access_token: null,
        refresh_token: null,
      },
      discord_user_id: null,
    });
    telegramNotificationRoute.produce({
      telegram_id: telegramId,
      content: `Ваша авторизация в боте была отозвана`,
      parse_mode: "HTML",
    });
  }

  return {
    user,
    discord,
  };
}
