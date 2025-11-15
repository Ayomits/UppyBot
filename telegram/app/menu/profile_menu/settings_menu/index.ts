import { Menu } from "@grammyjs/menu";

import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import { createRequireAuthMessage } from "#/telegram/app/messages/auth.message.js";
import { protectedInteraction } from "#/telegram/app/middlewares/protected-interaction.js";
import type { AppContext } from "#/telegram/utils/ctx.js";
import { Emojis } from "#/telegram/utils/emojis.js";

import { additionalMenuId } from "./additional_menu/index.js";
import { guildsMenuId } from "./guilds_menu/index.js";
import { notificationsMenuId } from "./notifications_menu/index.js";

export const settingsMenuId = "settings_menu";

export const settingsMenu = new Menu<AppContext>(settingsMenuId)
  .submenu(
    `${Emojis.ARROW_UP} Подключить серверы`,
    guildsMenuId,
    protectedInteraction
  )
  .submenu(
    `${Emojis.ALARM_CLOCK} Уведомления`,
    notificationsMenuId,
    protectedInteraction
  )
  .row()
  .submenu(
    `${Emojis.BEGINNER} Дополнительные`,
    additionalMenuId,
    protectedInteraction
  )
  .row()
  .text(
    `${Emojis.SAFETY_PIN} Отвязать аккаунт`,
    protectedInteraction,
    async (ctx) => {
      await ctx.answerCallbackQuery();
      ctx.deleteMessage();
      const msg = createRequireAuthMessage();
      await ctx.reply(msg.text!, {
        parse_mode: "HTML",
        reply_markup: msg.reply_markup,
      });
      const userRepository = NotificationUserRepository.create();
      await userRepository.updateByTgId(ctx.from!.id, {
        discord_user_id: null,
        tokens: { access_token: null, refresh_token: null, expires_at: null },
      });
    }
  )
  .row()
  .back(`${Emojis.ARROW_LEFT} Назад`, protectedInteraction);
