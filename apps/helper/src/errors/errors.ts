import { bold } from "discord.js";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";

import { createError } from "./create-error.js";

const ErrorTitle = "Ошибка";

export const ChannelDoesNotExistsError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Указанный канал ${bold("не существует")}`),
  ],
  ephemeral: true,
}));

export const ChannelTypeError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Указанный канал ${bold("не")} является текстовым`),
  ],
  ephemeral: true,
}));

export const ModuleDisabledError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Модуль, чьи команды Вы используете, не включен`),
  ],
}));

export const ForbiddenError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`У Вас недостаточно прав!`),
  ],
  ephemeral: true,
}));

export const SomethingWentWrongError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Что-то пошло не так`),
  ],
  ephemeral: true,
}));

export const NotHelperError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Указанный пользователь ${bold("не")} хелпер`),
  ],
  ephemeral: true,
}));

export const UserNotFoundError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Указанный пользователь ${bold("не")} найден`),
  ],
  ephemeral: true,
}));
