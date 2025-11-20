import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import { verifyProfileConnection } from "#/telegram/utils/is-profile-connected.js";

import type { AppCommand } from "../../interfaces/command.js";
import { oauth2Menu } from "../../menu/oauth2_menu/index.js";
import { profileMenu } from "../../menu/profile_menu/index.js";
import { createRequireAuthMessage } from "../../messages/auth.message.js";
import { createMainProfileMessage } from "../../messages/main-profile.message.js";

export const startCommand: AppCommand = async (ctx) => {
  const userRepository = NotificationUserRepository.create();

  const usr = await userRepository.findByTgId(ctx.from!.id);

  const isProfileConnected = verifyProfileConnection(usr);

  const waitingMessage = await ctx.reply("Подождите...");

  const msg = isProfileConnected
    ? await createMainProfileMessage(usr!)
    : createRequireAuthMessage();

  const menu = msg.shouldContinue ? profileMenu : oauth2Menu;

  await waitingMessage.delete();

  if (isProfileConnected && "image" in msg && msg.image) {
    const isGif = msg.image.startsWith("a_");

    if (isGif) {
      return ctx.replyWithAnimation(msg.image, {
        caption: msg.text,
        reply_markup: menu,
        parse_mode: "HTML",
      });
    } else {
      return ctx.replyWithPhoto(msg.image, {
        caption: msg.text,
        reply_markup: menu,
        parse_mode: "HTML",
      });
    }
  }

  return ctx.reply(msg.text!, {
    reply_markup: menu,
    parse_mode: "HTML",
  });
};
