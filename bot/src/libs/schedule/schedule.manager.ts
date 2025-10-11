import { LocalCache } from "@ts-fetcher/cache";
import { DateTime } from "luxon";
import { injectable } from "tsyringe";

import { DefaultTimezone } from "#/app/controllers/reminder/reminder.const.js";

import { logger } from "../logger/logger.js";

export type ScheduleCache = { date: Date; timer: NodeJS.Timeout };

@injectable()
export class ScheduleManager {
  private cache: LocalCache<string, ScheduleCache>;

  constructor() {
    this.cache = new LocalCache();
  }

  public startOnceJob(
    name: string,
    date: Date,
    callback: () => Promise<void> | void,
  ) {
    const existed = this.cache.get(name);
    if (existed) {
      clearTimeout(existed);
    }
    const now = DateTime.now().setZone(DefaultTimezone);
    const GMTdate = DateTime.fromJSDate(date).setZone(DefaultTimezone);
    const delay = GMTdate.toMillis() - now.toMillis();
    this.cache.set(
      name,
      { date: GMTdate.toJSDate(), timer: setTimeout(callback, delay) },
      delay,
    );
  }

  public startPeriodJob(
    name: string,
    interval: number,
    callback: () => Promise<void> | void,
  ) {
    this.cache.set(
      name,
      {
        date: DateTime.now().setZone(DefaultTimezone).toJSDate(),
        timer: setInterval(callback, interval),
      },
      Infinity,
    );
  }

  public getJob(name: string) {
    return this.cache.get<ScheduleCache>(name);
  }

  public updateJob(...args: Parameters<typeof this.startOnceJob>) {
    const [name] = args;
    this.stopJob(name);
    this.startOnceJob(...args);
  }

  public stopJob(name: string) {
    const timeout = this.cache.get(name);
    if (timeout) {
      try {
        clearTimeout(timeout.timer);
        clearInterval(timeout.timer);
      } catch (err) {
        logger.error(err);
      }
      this.cache.delete(name);
    }
  }

  public getAll() {
    return this.cache.keys();
  }
}

export const scheduleManager = new ScheduleManager();
