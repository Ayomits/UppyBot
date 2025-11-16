import type { NextFunction } from "grammy";

import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import type { AppContext } from "#/telegram/utils/ctx.js";
import { verifyProfileConnection } from "#/telegram/utils/is-profile-connected.js";

import { createRequireAuthMessage } from "../messages/auth.message.js";

export async function protectedInteraction(
  ctx: AppContext,
  next: NextFunction
) {
  const repository = NotificationUserRepository.create();
  const user = await repository.findByTgId(ctx.from!.id);

  const isConnected = verifyProfileConnection(user!);

  if (!isConnected) {
    const msg = createRequireAuthMessage();
    await ctx.reply(msg.text, {
      reply_markup: msg.reply_markup,
      parse_mode: "HTML",
    });
    // @ts-expect-error this method should exists i guess
    await ctx.menu.close();
    return;
  }

  await next();
}
