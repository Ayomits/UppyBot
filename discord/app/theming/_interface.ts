import type { AttachmentBuilder } from "discord.js";

export interface ThemingService<T = undefined> {
  draw(options?: T): Promise<AttachmentBuilder>;
}
