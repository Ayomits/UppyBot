import { Menu, MenuRange } from "@grammyjs/menu";

import type { NotificationUser } from "#/shared/db/models/uppy-telegram/user.model.js";
import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import { chunkArray } from "#/shared/libs/json/chunk.js";
import { createMainProfileMessage } from "#/telegram/app/messages/main-profile.message.js";
import { protectedInteraction } from "#/telegram/app/middlewares/protected-interaction.js";
import type { AppContext } from "#/telegram/utils/ctx.js";
import { Emojis } from "#/telegram/utils/emojis.js";

export const additionalMenuId = "additional_menu";

async function toggleSetting(
  ctx: AppContext,
  field: keyof NotificationUser["settings"],
) {
  const repository = NotificationUserRepository.create();

  const existed = await repository.findByTgId(ctx.from!.id);

  const user = await repository.updateByTgId(ctx.from!.id, {
    [`settings.${field}`]: !existed?.settings?.[field],
  });

  const msg = await createMainProfileMessage(user);

  await ctx.editMessageCaption({
    caption: msg.text!,
    parse_mode: "HTML",
  });
}

function createAdditionalToggler(
  range: MenuRange<AppContext>,
  existed: NotificationUser,
  field: keyof NotificationUser["settings"],
) {
  const fieldTexts: Partial<
    Record<keyof NotificationUser["settings"], string>
  > = {
    bump_ban: "Бамп баны",
    allow_force_reminds: "Преждевременные напоминания",
  } as const;
  return range.text(
    `${existed?.settings?.[field] ? Emojis.GREEN_CIRCLE : Emojis.RED_CIRCLE} ${fieldTexts[field]}`,
    protectedInteraction,
    (ctx) => toggleSetting(ctx, field as keyof NotificationUser["settings"]),
  );
}

export const additionalMenu = new Menu<AppContext>(additionalMenuId)
  .dynamic(async (ctx) => {
    const range = new MenuRange<AppContext>();

    const fields: (keyof NotificationUser["settings"])[][] = chunkArray(
      ["allow_force_reminds", "bump_ban"],
      2,
    );

    const repository = NotificationUserRepository.create();
    const existed = await repository.findByTgId(ctx.from!.id);

    for (const chunk of fields) {
      for (const field of chunk) {
        createAdditionalToggler(range, existed!, field);
      }
      range.row();
    }

    return range;
  })
  .back(`${Emojis.ARROW_LEFT} Назад`, protectedInteraction)
  .row();
