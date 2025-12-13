import { Menu, MenuRange } from "@grammyjs/menu";

import { fetchOauth2UppyUrl } from "#/shared/api/uppy/index.js";
import { NotificationUserTokenRepository } from "#/shared/db/repositories/uppy-telegram/token.repository.js";
import type { AppContext } from "#/telegram/utils/ctx.js";

export const oauth2Menu = new Menu<AppContext>("oauth2_menu").dynamic(
  async (ctx) => {
    const repository = NotificationUserTokenRepository.create();
    const authorId = ctx.from!.id;
    const token = await repository.sign(authorId);
    const payload = await fetchOauth2UppyUrl(authorId, token).catch(
      () => {
        return null;
      },
    );

    const range = new MenuRange<AppContext>();

    if (!payload) {
      return range;
    }

    if (payload.data) return range.url(`Авторизироваться`, payload.data.url);
  },
);
