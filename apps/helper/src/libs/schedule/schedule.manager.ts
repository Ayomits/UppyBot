import { LocalCache } from "@ts-fetcher/cache";
import { injectable } from "tsyringe";

@injectable()
export class ScheduleManager {
  private cache: LocalCache<string, NodeJS.Timeout>;

  constructor() {
    this.cache = new LocalCache();
  }

  public startOnceJob(
    name: string,
    date: Date,
    callback: () => Promise<void> | void,
  ) {
    const delay = date.getTime() - Date.now();
    this.cache.set(name, setTimeout(callback, delay), delay);
  }

  public startPeriodJob(
    name: string,
    interval: number,
    callback: () => Promise<void> | void,
  ) {
    this.cache.set(name, setInterval(callback, interval), Infinity);
  }

  public getJob(name: string) {
    return this.cache.get<NodeJS.Timeout>(name);
  }

  public updateJob(...args: Parameters<typeof this.startOnceJob>) {
    const [name] = args;
    this.stopJob(name);
    this.startOnceJob(...args);
  }

  public stopJob(name: string) {
    const timeout = this.cache.get(name);
    try {
      clearTimeout(timeout);
      clearInterval(timeout);
    } catch (err) {
      console.error(err);
    }
    this.cache.delete(name);
  }
}
