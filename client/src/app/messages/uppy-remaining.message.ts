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
} from "../controllers/reminder/reminder.const.js";
import {
  DefaultTimezone,
  getBotByRemindType,
} from "../controllers/reminder/reminder.const.js";

const canUseMonitoring = (monitoring?: RemindDocument) => {
  if (!monitoring) return "Нет данных";

  const timestamp = DateTime.fromJSDate(monitoring.timestamp)
    .setZone(DefaultTimezone)
    .toMillis();

  const curr = DateTime.now().setZone(DefaultTimezone).toMillis();

  return curr > timestamp
    ? `${chatInputApplicationCommandMention(getCommandNameByRemindType(monitoring.type)!, getCommandIdByRemindType(monitoring.type)!)}`
    : time(Math.floor(timestamp / 1_000), TimestampStyles.RelativeTime);
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
        values.push(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          `${userMention(getBotByRemindType(Number(key) as any))}: ${canUseMonitoring(monitorings[key])}`,
        );
      }

      return values.join("\n");
    },
  },
} as const;
