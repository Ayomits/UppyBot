import {bold, MessageFlags} from "discord.js";

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
  flags: MessageFlags.Ephemeral,
}));

export const ChannelTypeError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Указанный канал ${bold("не")} является текстовым`),
  ],
  flags: MessageFlags.Ephemeral,
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
  flags: MessageFlags.Ephemeral,
}));

export const SomethingWentWrongError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Что-то пошло не так`),
  ],
  flags: MessageFlags.Ephemeral,
}));

export const NotHelperError = createError((interaction) => ({
  embeds: [
    new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(ErrorTitle)
      .setDescription(`Указанный пользователь ${bold("не")} хелпер`),
  ],
  flags: MessageFlags.Ephemeral,
}));

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
