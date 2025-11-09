import { Logger as AyoLogger } from "ayologger";
import type { ILogger } from "discordx";

import { Env } from "../config/index.js";

const ayoLogger = new AyoLogger();

export class Logger implements ILogger {
  error(...args: unknown[]): void {
    ayoLogger.error(...args);
  }
  info(...args: unknown[]): void {
    ayoLogger.info(...args);
  }
  log(...args: unknown[]): void {
    ayoLogger.info(...args);
  }
  debug(...args: unknown[]): void {
    if (Env.AppEnv !== "dev") return;
    ayoLogger.info(...args);
  }
  success(...args: unknown[]): void {
    ayoLogger.success(...args);
  }
  warn(...args: unknown[]): void {
    ayoLogger.warn(...args);
  }
}

export const logger = new Logger();
