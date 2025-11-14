import type { ImageSize } from "discord.js";

export class DiscordCdn {
  private cdnUrl = `https://cdn.discordapp.com`;

  static create() {
    return new DiscordCdn();
  }

  getUserAvatar(
    id: string,
    avatar: string | null | undefined,
    size?: ImageSize
  ) {
    if (!avatar) {
      const defaultIndex = (BigInt(id) >> 22n) % 6n;
      return `${this.cdnUrl}/embed/avatars/${defaultIndex}.png`;
    }
    return `${this.cdnUrl}/avatars/${id}/${avatar}.webp?size=${size}`;
  }
}
