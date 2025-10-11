import { Logger as AyoLogger } from "ayologger";
import type { ILogger } from "discordx";

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
  success(...args: unknown[]): void {
    ayoLogger.success(...args);
  }
  warn(...args: unknown[]): void {
    ayoLogger.warn(...args);
  }
}

export const logger = new Logger();
