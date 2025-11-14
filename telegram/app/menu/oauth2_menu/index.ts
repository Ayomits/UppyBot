import { Menu } from "@grammyjs/menu";

import { fetchOauth2UppyUrl } from "#/shared/api/uppy/index.js";
import { NotificationUserTokenRepository } from "#/shared/db/repositories/uppy-telegram/token.repository.js";
import type { AppContext } from "#/telegram/utils/ctx.js";

export const oauth2Menu = new Menu<AppContext>("oauth2_menu").url(
  "Авторизироваться",
  async (ctx) => {
    const repository = NotificationUserTokenRepository.create();
    const token = await repository.sign(ctx.chatId!);
    const payload = await fetchOauth2UppyUrl(ctx.chatId!, token);

    return payload?.data?.url;
  },
);
