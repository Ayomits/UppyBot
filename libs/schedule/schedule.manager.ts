import { cancelJob, scheduledJobs, scheduleJob } from "node-schedule";
import { injectable } from "tsyringe";

export type ScheduleCache = { date: Date; timer: NodeJS.Timeout };

@injectable()
export class ScheduleManager {
  public startOnceJob(
    name: string,
    date: Date,
    callback: () => Promise<void> | void,
  ) {
    scheduleJob(name, date, callback);
  }

  public getJob(name: string) {
    return scheduledJobs[name];
  }

  public updateJob(...args: Parameters<typeof this.startOnceJob>) {
    const [name] = args;
    this.stopJob(name);
    this.startOnceJob(...args);
  }

  public stopJob(name: string) {
    cancelJob(name);
  }
}

export const scheduleManager = new ScheduleManager();
