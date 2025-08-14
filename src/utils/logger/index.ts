import { inspect } from "node:util";

import chalk from "chalk";
import dayjs from "dayjs";

export default class Logger {
  private static formatTime(): string {
    return dayjs().format("DD MMM YYYY HH:mm:ss");
  }

  private static formatContent(content: unknown[]): string {
    return content
      .map((item) =>
        typeof item === "string"
          ? item
          : inspect(item, { colors: true, depth: 2 }),
      )
      .join(" ");
  }

  private static universalLog(
    label: string,
    color: chalk.Chalk,
    ...content: unknown[]
  ): void {
    const time = chalk.gray(`[${this.formatTime()}]`);
    const tag = color(` ${label} `);
    const message = this.formatContent(content);
    console.log(`${tag} ${time} ${message}`);
  }

  public static info(...content: unknown[]) {
    this.universalLog("INFO", chalk.bgBlueBright.black, ...content);
  }

  public static warn(...content: unknown[]) {
    this.universalLog("WARN", chalk.bgYellow.black, ...content);
  }

  public static error(...content: unknown[]) {
    this.universalLog("ERROR", chalk.bgRed.black, ...content);
  }

  public static success(...content: unknown[]) {
    this.universalLog("SUCCESS", chalk.bgGreen.black, ...content);
  }

  public static debug(...content: unknown[]) {
    this.universalLog("DEBUG", chalk.bgMagenta.black, ...content);
  }

  public static critical(...content: unknown[]) {
    this.universalLog("CRIT", chalk.bgRedBright.black.bold, ...content);
  }
}
