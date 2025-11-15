import type { DocumentType } from "@typegoose/typegoose";
import type { ParseMode } from "grammy/types";

import { fetchDiscordOauth2User } from "#/shared/api/discord/index.js";
import type { NotificationUser } from "#/shared/db/models/uppy-telegram/user.model.js";
import { DiscordCdn } from "#/shared/libs/cdn/index.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";
import { getUserGuilds } from "#/telegram/utils/get-user-guilds.js";
import { bold, cursive, inlineCode } from "#/telegram/utils/html-markdown.js";
import { resolveBoolean } from "#/telegram/utils/resolve-boolean.js";

type MessageRes = { text: string; image: string | null; parse_mode: ParseMode };

export async function createMainProfileMessage(
  usr: DocumentType<NotificationUser>
): Promise<Partial<MessageRes>> {
  const entries: string[] = [];
  const cryptography = CryptographyService.create();
  const res: Partial<MessageRes> = {};

  const accessToken = cryptography.decrypt(usr!.tokens.access_token!);

  const discordGuilds = await getUserGuilds(accessToken, usr);
  const discordUser = await fetchDiscordOauth2User(accessToken);

  const cdn = DiscordCdn.create();
  res.image = cdn.getUserAvatar(discordUser.id, discordUser.avatar, 4096);

  entries.push(
    bold(`Данные пользователя:`),
    `Айди в дискорде: ${inlineCode(usr!.discord_user_id!)}`,
    `Айди в телеграме: ${inlineCode(usr!.telegram_user_id.toString())}`,
    ``,
    bold(`Подключенные уведомления:`),
    `${cursive(`Discord Monitoring`)}: ${inlineCode(resolveBoolean(usr?.notifications?.ds))}`,
    `${cursive(`SDC. Monitoring`)}: ${inlineCode(resolveBoolean(usr?.notifications?.sdc))}`,
    `${cursive(`Server Monitoring`)}: ${inlineCode(resolveBoolean(usr?.notifications?.server))}`,
    `${cursive(`Disboard`)}: ${inlineCode(resolveBoolean(usr?.notifications?.disboard))}`,
    ``,
    bold(`Дополнительные настройки:`),
    `${cursive(`Высылать преждевременные напоминания:`)}: ${inlineCode(resolveBoolean(usr?.settings?.allow_force_reminds))}`,
    `${cursive(`Высылать бамп баны:`)}: ${inlineCode(resolveBoolean(usr?.settings?.bump_ban))}`,
    ``,
    bold(`Подключенные серверы:`),
    `${
      discordGuilds.length
        ? discordGuilds
            .map((g, i) => `${bold((i + 1).toString())}. ${cursive(g.name)}`)
            .join("\n")
        : cursive(`Нет`)
    }`
  );

  res.text = entries.join("\n");
  res.parse_mode = "HTML";

  return res;
}
