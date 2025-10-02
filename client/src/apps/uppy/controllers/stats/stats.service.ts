import { type Guild, type GuildMember } from "discord.js";
import { DateTime } from "luxon";
import { injectable } from "tsyringe";

import type { MonitoringBot } from "../reminder/reminder.const.js";
import { DefaultTimezone } from "../reminder/reminder.const.js";
import { endDateValue, startDateValue } from "./stats.const.js";

@injectable()
export class BaseUppyService {
  protected calculateMaxPages(count: number, limit = 10) {
    return Math.max(1, Math.ceil(count / limit));
  }

  protected parseOptionsDateString(from?: string, to?: string) {
    const parsedFromDate =
      !from && !to
        ? DateTime.now()
            .setZone(DefaultTimezone)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        : DateTime.fromJSDate(new Date(from ?? to)).setZone(DefaultTimezone);
    const parsedToDate =
      !from && !to
        ? parsedFromDate
        : DateTime.fromJSDate(new Date(to ?? from)).setZone(DefaultTimezone);

    let toDate: DateTime = parsedToDate.set(endDateValue);
    let fromDate: DateTime = parsedFromDate.set(startDateValue);

    if (parsedToDate <= parsedFromDate) {
      toDate = parsedFromDate.set(endDateValue);
      fromDate = parsedToDate.set(startDateValue);
    }

    return {
      toDate,
      fromDate,
    };
  }

  protected async fetchMonitoringBot(
    guild: Guild,
    id: MonitoringBot,
  ): Promise<GuildMember | null> {
    return await guild.members
      .fetch({ user: id, cache: true })
      .catch(() => null);
  }
}
