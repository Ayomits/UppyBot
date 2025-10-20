import { APIGuild, APIUser } from 'discord-api-types/v10';

const baseUrl = 'https://cdn.discordapp.com';

export function getUserAvatar(user: APIUser) {
  if (user.avatar) {
    return `${baseUrl}/avatars/${user.id}/${user.avatar}.webp`;
  }

  return `${baseUrl}/embed/avatars/0.png`;
}

export function getDiscordGuildAvatar(guild: APIGuild) {
  return `${baseUrl}/icons/${guild.id}/${guild.icon}.webp`;
}
