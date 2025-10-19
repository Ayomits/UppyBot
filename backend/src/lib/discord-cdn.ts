import { APIUser } from 'discord-api-types/v10';

export function getUserAvatar(user: APIUser) {
  const baseUrl = 'https://cdn.discordapp.com';

  if (user.avatar) {
    return `${baseUrl}/avatars/${user.id}/${user.avatar}.webp`;
  }

  return `${baseUrl}/embed/avatars/0.png`;
}
