export const AppRoutes = {
  Home: "/",
  Servers: "/dashboard",
  Settings: (guildId: string) => `/dashboard/${guildId}/settings`,
  PointSettings: (guildId: string) => `/dashboard/${guildId}/point-settings`,
} as const;

export const ExternalLinks = {
  Docs: "https://docs.uppy-bot.ru",
  DevsTgc: "https://t.me/no_dev",
  BotTgc: "https://t.me/UppyBotNews",
  SupportServer: "https://discord.gg/Vd4Ssfxpuc",
  InviteBot:
    "https://discord.com/oauth2/authorize?client_id=1413244173225693214&integration_type=0&scope=bot",
  Tos: "https://www.youtube.com/watch?v=xvFZjo5PgG0&list=RDxvFZjo5PgG0&start_radio=1u",
  Privacy:
    "https://www.youtube.com/watch?v=xvFZjo5PgG0&list=RDxvFZjo5PgG0&start_radio=1",
} as const;
