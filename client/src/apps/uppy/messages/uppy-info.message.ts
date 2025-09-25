import { bold, unorderedList } from "discord.js";

import type { StaffInfoAgregation } from "#/models/bump.model.js";
import type { BumpBan } from "#/models/bump-ban.model.js";

import { BumpBanLimit } from "../controllers/reminder/reminder.const.js";

function normalize(label: string, value?: number) {
  return `${bold(label)}: ${value ? value.toString() : "0"}`;
}

function bumpBanNormalize(data?: BumpBan) {
  if (!data) {
    return "Не активен";
  }
  return `${BumpBanLimit - (data?.removeIn ?? 0)} до снятия`;
}

export const UppyInfoMessage = {
  embed: {
    title: (username: string) => `Информация о сотруднике - ${username}`,
    fields: (data: StaffInfoAgregation, bumpBan?: BumpBan): string => {
      return unorderedList([
        normalize("UP:", data?.up),
        normalize("Like:", data?.like),
        normalize("Bump:", data?.bump),
        normalize("Поинты:", data?.points),
        `${bold("Бамп бан:")} ${bumpBanNormalize(bumpBan)}`,
      ]);
    },
  },
  buttons: {
    actions: {
      removeBumpBan: {
        label: "Снять бамп бан",
        success: "Бамп бан успешно снят",
      },
    },
  },
  errors: {
    noBumpBan: "У пользователя нет бамп бана",
    notSetUpped: "Роль бамп бана не настроена",
    forbidden: "У вас нет права снимать бамп бан",
  },
};
