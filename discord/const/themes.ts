import { StringSelectMenuOptionBuilder } from "discord.js";

import type { LiteralEnum } from "#/shared/libs/djs/types.js";

export const AppThemes = {
  Green: "green",
  Blue: "blue",
  Red: "red",
  Orange: "orange",
  Pink: "pink",
  Purple: "purple",
  Sky: "sky",
  White: "white",
  Yellow: "yellow",
} as const;

export type ThemeType = LiteralEnum<typeof AppThemes>;

function getEmojiForTheme(theme: string): string {
  const emojiMap: Record<ThemeType, string> = {
    [AppThemes.Green]: "🟢",
    [AppThemes.Blue]: "🔵",
    [AppThemes.Red]: "🔴",
    [AppThemes.Orange]: "🟠",
    [AppThemes.Pink]: "🌸",
    [AppThemes.Purple]: "🟣",
    [AppThemes.Sky]: "🌤️",
    [AppThemes.White]: "⚪",
    [AppThemes.Yellow]: "🟡",
  };
  return emojiMap[theme] || "⚪";
}

export function getThemeLabel(theme: string): string {
  const labelMap: Record<ThemeType, string> = {
    [AppThemes.Green]: "Зеленая",
    [AppThemes.Blue]: "Синяя",
    [AppThemes.Red]: "Красная",
    [AppThemes.Orange]: "Оранжевая",
    [AppThemes.Pink]: "Розовая",
    [AppThemes.Purple]: "Фиолетовая",
    [AppThemes.Sky]: "Небесная",
    [AppThemes.White]: "Белая",
    [AppThemes.Yellow]: "Желтая",
  };
  return labelMap[theme] || "Неизвестная";
}

export function getThemeStringSelectOptions(): StringSelectMenuOptionBuilder[] {
  return Object.values(AppThemes).map((theme) => {
    return new StringSelectMenuOptionBuilder()
      .setLabel(getThemeLabel(theme))
      .setValue(theme)
      .setEmoji(getEmojiForTheme(theme));
  });
}

export function getStringSelectOption(
  theme: ThemeType,
): StringSelectMenuOptionBuilder {
  return new StringSelectMenuOptionBuilder()
    .setLabel(getThemeLabel(theme))
    .setValue(theme)
    .setEmoji(getEmojiForTheme(theme));
}

export function getAvatarName(theme: string): string | undefined {
  const avatarMap: Record<ThemeType, string> = {
    [AppThemes.Green]: "assets/images/avatar/avatar_green.png",
    [AppThemes.Blue]: "assets/images/avatar/avatar_blue.png",
    [AppThemes.Red]: "assets/images/avatar/avatar_red.png",
    [AppThemes.Orange]: "assets/images/avatar/avatar_orange.png",
    [AppThemes.Pink]: "assets/images/avatar/avatar_pink.png",
    [AppThemes.Purple]: "assets/images/avatar/avatar_purple.png",
    [AppThemes.Sky]: "assets/images/avatar/avatar_sky.png",
    [AppThemes.White]: "assets/images/avatar/avatar_white.png",
    [AppThemes.Yellow]: "assets/images/avatar/avatar_yellow.png",
  };
  return avatarMap[theme];
}

export function getBannerName(theme: string): string | undefined {
  const bannerMap: Record<ThemeType, string> = {
    [AppThemes.Green]: "assets/images/banner/banner_green.png",
    [AppThemes.Blue]: "assets/images/banner/banner_blue.png",
    [AppThemes.Red]: "assets/images/banner/banner_red.png",
    [AppThemes.Orange]: "assets/images/banner/banner_orange.png",
    [AppThemes.Pink]: "assets/images/banner/banner_pink.png",
    [AppThemes.Purple]: "assets/images/banner/banner_purple.png",
    [AppThemes.Sky]: "assets/images/banner/banner_sky.png",
    [AppThemes.White]: "assets/images/banner/banner_white.png",
    [AppThemes.Yellow]: "assets/images/banner/banner_yellow.png",
  };
  return bannerMap[theme];
}
