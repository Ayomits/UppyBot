import {
  chatInputApplicationCommandMention,
  time,
  TimestampStyles,
  userMention,
} from "discord.js";
import { DateTime } from "luxon";

import type { RemindDocument } from "#/models/remind.model.js";

import {
  getCommandIdByRemindType,
  getCommandNameByRemindType,
} from "../controllers/public/reminder/reminder.const.js";
import {
  DefaultTimezone,
  getBotByRemindType,
} from "../controllers/public/reminder/reminder.const.js";

const canUseMonitoring = (monitoring?: RemindDocument) => {
  if (!monitoring) return "Нет данных";

  const timestamp = DateTime.fromJSDate(monitoring.timestamp)
    .setZone(DefaultTimezone)
    .toMillis();

  const curr = DateTime.now().setZone(DefaultTimezone).toMillis();

  const dsTimestamp = Math.floor(timestamp / 1_000);

  return curr > timestamp
    ? `${chatInputApplicationCommandMention(getCommandNameByRemindType(monitoring.type)!, getCommandIdByRemindType(monitoring.type)!)}`
    : `${time(dsTimestamp, TimestampStyles.RelativeTime)} ${time(dsTimestamp, TimestampStyles.LongTime)}`;
};

export const UppyRemainingMessage = {
  buttons: {
    update: "Обновить информацию",
  },
  embed: {
    title: "Статус мониторингов",
    fields: (monitorings: Record<string, RemindDocument>): string => {
      const values: string[] = [];

      for (const key in monitorings) {
        const monitoring = monitorings[key];
        values.push(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          `${userMention(getBotByRemindType(Number(key) as any))}: ${canUseMonitoring(monitoring)}`
        );
      }

      if (values.length === 0) {
        return "Нет мониторингов на сервере";
      }

      return values.join("\n");
    },
  },
} as const;
