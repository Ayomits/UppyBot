export class CustomIdParser {
  /**
   * Uses for parse arguments from customId. If you place something like userId or role to customId you can get it
   */
  static parseArguments(
    customId: string,
    {
      pattern = /(?<=_\()[^)]*(?=\))|_/,
      returnFull = false,
    }: {
      pattern?: RegExp | string;
      returnFull?: boolean;
    },
  ) {
    const splitedCustomId = customId.split(pattern);
    return splitedCustomId.slice(returnFull ? 0 : 1, splitedCustomId.length);
  }
}
