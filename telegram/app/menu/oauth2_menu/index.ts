import { Menu, MenuRange } from "@grammyjs/menu";
import { logger } from "@typegoose/typegoose/lib/logSettings.js";

import { fetchOauth2UppyUrl } from "#/shared/api/uppy/index.js";
import { NotificationUserTokenRepository } from "#/shared/db/repositories/uppy-telegram/token.repository.js";
import type { AppContext } from "#/telegram/utils/ctx.js";

export const oauth2Menu = new Menu<AppContext>("oauth2_menu").dynamic(
  async (ctx) => {
    const repository = NotificationUserTokenRepository.create();
    const token = await repository.sign(ctx.chatId!);
    const payload = await fetchOauth2UppyUrl(ctx.chatId!, token).catch(
      logger.error
    );

    const range = new MenuRange<AppContext>();

    if (!payload) {
      return range;
    }

    if (payload.data) return range.url(`Авторизироваться`, payload.data.url);
  }
);
