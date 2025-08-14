import { bold } from "discord.js";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { DefaultColors } from "#/utils/enums/default-colors.js";

import { createError } from "./create-error.js";

const ErrorTitle = "Ошибка";

export const throwChannelDoesNotExistsError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Указанный канал ${bold("не существует")}`)
      .setColor(DefaultColors.Default),
  ],
  ephemeral: true,
}));

export const throwChannelTypeError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Указанный канал ${bold("не")} является текстовым`)
      .setColor(DefaultColors.Default),
  ],
  ephemeral: true,
}));

export const throwModuleDisabledError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Модуль, чьи команды Вы используете, не включен`)
      .setColor(DefaultColors.Default),
  ],
}));

export const throwForbiddenError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`У Вас недостаточно прав!`)
      .setColor(DefaultColors.Default),
  ],
  ephemeral: true,
}));

export const throwSomethingWentWrongError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Что-то пошло не так`)
      .setColor(DefaultColors.Default),
  ],
  ephemeral: true,
}));

export const throwNotHelperError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Указанный пользователь ${bold("не")} хелпер`)
      .setColor(DefaultColors.Default),
  ],
  ephemeral: true,
}));

export const throwUserNotFoundError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Указанный пользователь ${bold("не")} найден`)
      .setColor(DefaultColors.Default),
  ],
  ephemeral: true,
}));
