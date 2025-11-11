import { bold, MessageFlags } from "discord.js";

import { EmbedBuilder } from "#/shared/libs/embed/embed.builder.js";

import { createError } from "./create-error.js";

const ErrorTitle = "Ошибка";

export const UserNotFoundError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Указанный пользователь ${bold("не")} найден`),
  ],
  flags: MessageFlags.Ephemeral,
}));

export const EmptyStaffRoleError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`На сервере не настроены роли сотрудников`),
  ],
  flags: MessageFlags.Ephemeral,
}));
