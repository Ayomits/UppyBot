import type { EmbedField } from "discord.js";
import { blockQuote, codeBlock, time, TimestampStyles } from "discord.js";
import { DateTime } from "luxon";

import type { RemindDocument } from "#/models/remind.model.js";

import type { getCommandByRemindType } from "../controllers/reminder/reminder.const.js";
import {
  DefaultTimezone,
  MonitoringCommand,
} from "../controllers/reminder/reminder.const.js";

const canUseMonitoring = (monitoring?: RemindDocument) => {
  if (!monitoring) return codeBlock("Нет активных напоминаний");

  const timestamp = DateTime.fromJSDate(monitoring.timestamp)
    .setZone(DefaultTimezone)
    .toMillis();

  const curr = DateTime.now().setZone(DefaultTimezone).toMillis();

  return curr > timestamp
    ? codeBlock("Можно использовать")
    : time(Math.floor(timestamp / 1_000), TimestampStyles.RelativeTime);
};

export const UppyRemainingMessage = {
  buttons: {
    update: "Обновить информацию",
  },
  embed: {
    title: "Статус мониторингов",
    fields: (
      monitorings: Record<
        ReturnType<typeof getCommandByRemindType>,
        RemindDocument
      >,
    ): EmbedField[] => [
      {
        name: blockQuote(MonitoringCommand.DiscordMonitoring),
        value: canUseMonitoring(monitorings.like),
        inline: true,
      },
      {
        name: blockQuote(MonitoringCommand.SdcMonitoring),
        value: canUseMonitoring(monitorings.up),
        inline: true,
      },
      {
        name: blockQuote(`bump (server monitoring)`),
        value: canUseMonitoring(monitorings.server_bump),
        inline: true,
      },
      {
        name: blockQuote(`bump (disboard)`),
        value: canUseMonitoring(monitorings.disboard_bump),
        inline: true,
      },
    ],
  },
};
