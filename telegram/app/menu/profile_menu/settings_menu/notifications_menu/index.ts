import { Menu, MenuRange } from "@grammyjs/menu";

import type { NotificationUser } from "#/shared/db/models/uppy-telegram/user.model.js";
import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import { chunkArray } from "#/shared/libs/json/chunk.js";
import { createMainProfileMessage } from "#/telegram/app/messages/main-profile.message.js";
import { protectedInteraction } from "#/telegram/app/middlewares/protected-interaction.js";
import type { AppContext } from "#/telegram/utils/ctx.js";
import { Emojis } from "#/telegram/utils/emojis.js";

export const notificationsMenuId = "notifications_menu";

async function toggleNotification(
  ctx: AppContext,
  field: keyof NotificationUser["notifications"],
) {
  const repository = NotificationUserRepository.create();

  const existed = await repository.findByTgId(ctx.from!.id);

  const user = await repository.updateByTgId(ctx.from!.id, {
    [`notifications.${field}`]: !existed?.notifications[field],
  });

  const msg = await createMainProfileMessage(user);

  await ctx.editMessageCaption({
    caption: msg.text!,
    parse_mode: "HTML",
  });
}

function createNotificationToggler(
  range: MenuRange<AppContext>,
  existed: NotificationUser,
  field: keyof NotificationUser["notifications"],
) {
  const fieldTexts: Record<keyof NotificationUser["notifications"], string> = {
    ds: "DS Monitoring",
    sdc: "SDC Monitoring",
    disboard: "Disboard Monitoring",
    server: "Server Monitoring",
  } as const;
  return range.text(
    `${existed?.notifications?.[field] ? Emojis.GREEN_CIRCLE : Emojis.RED_CIRCLE} ${fieldTexts[field]}`,
    protectedInteraction,
    (ctx) =>
      toggleNotification(ctx, field as keyof NotificationUser["notifications"]),
  );
}

export const notificationsMenu = new Menu<AppContext>(notificationsMenuId)
  .dynamic(async (ctx) => {
    const range = new MenuRange<AppContext>();

    const fields: (keyof NotificationUser["notifications"])[][] = chunkArray(
      ["ds", "sdc", "server", "disboard"],
      2,
    );

    const repository = NotificationUserRepository.create();
    const existed = await repository.findByTgId(ctx.from!.id);

    for (const chunk of fields) {
      for (const field of chunk) {
        createNotificationToggler(range, existed!, field);
      }
      range.row();
    }

    return range;
  })
  .back(`${Emojis.ARROW_LEFT} Назад`, protectedInteraction)
  .row();
