import { Env } from "#/shared/libs/config/index.js";

export const DISCORD_URL = "https://discord.com";
export const WEBHOOKS_URL =
  Env.AppEnv === "dev"
    ? "http://localhost:4200/uppy/notifications"
    : "https://notifications.uppy-bot.ru";
