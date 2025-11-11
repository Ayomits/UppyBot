import { codeBlock } from "discord.js";

export class TextFormattingUtility {
  public static snowflakeMention<T extends string | string[] = string>(
    snowflakes?: T,
    separator = ", ",
  ): string {
    const value = Array.isArray(snowflakes) ? snowflakes.length : snowflakes;
    return value
      ? [...(Array.isArray(snowflakes) ? snowflakes : [snowflakes])].join(
          separator,
        )
      : codeBlock("Нет");
  }
}
