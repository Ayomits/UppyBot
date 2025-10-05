import type { Snowflake, User } from "discord.js";
import {
  bold,
  chatInputApplicationCommandMention,
  roleMention,
  time,
  TimestampStyles,
  unorderedList,
  userMention,
} from "discord.js";
import { DateTime } from "luxon";

import type { RemindDocument } from "#/models/remind.model.js";

import {
  getCommandNameByCommandId,
  type MonitoringCommandIds,
} from "../controllers/reminder/reminder.const.js";

export function calculateReactionTime(curr: Date, diff: Date) {
  const { years, months, weeks, days, hours, minutes, seconds } =
    DateTime.fromJSDate(curr).diff(DateTime.fromJSDate(diff), [
      "years",
      "months",
      "weeks",
      "days",
      "hours",
      "minutes",
      "seconds",
    ]);

  function format() {
    const toFormat: string[] = [];

    if (years > 0) {
      toFormat.push(`${Math.floor(years)} лет`);
    }

    if (months > 0) {
      toFormat.push(`${Math.floor(months)} месяцев`);
    }

    if (weeks > 0) {
      toFormat.push(`${Math.floor(weeks)} недель`);
    }

    if (days > 0) {
      toFormat.push(`${Math.floor(days)} дней`);
    }

    if (hours > 0) {
      toFormat.push(`${Math.floor(hours)} часов`);
    }

    if (minutes > 0) {
      toFormat.push(`${Math.floor(minutes)} минут`);
    }

    if (seconds > 0) {
      toFormat.push(`${Math.floor(seconds)} секунд`);
    }

    return toFormat.join(" ");
  }

  return format();
}

export const UppyRemindSystemMessage = {
  remind: {
    warning: {
      content: (roles: Snowflake[], command: string) =>
        `${roles.map(roleMention).join(" ")}, у системы сбился таймер для ${command}. Пропишите пожалуйста команду для запуска`,
    },

    force: {
      content: (
        roles: Snowflake[],
        commandName: string,
        commandId: string,
        force: number,
      ) =>
        `${roles.map(roleMention).join(" ")}, команда ${chatInputApplicationCommandMention(commandName, commandId)} будет доступа ${time(Math.floor((Date.now() + force * 1_000) / 1_000), TimestampStyles.RelativeTime)}`,
    },

    ping: {
      content: (roles: Snowflake[], commandName: string, commandId: string) =>
        `${roles.map(roleMention).join(" ")}, пора использовать команду ${chatInputApplicationCommandMention(commandName, commandId)}!`,
      embed: {
        title: "Продвижение сервера",
        description: "Самое время для прописания команды мониторинга",
      },
    },
  },

  monitoring: {
    embed: {
      title: "Продвижение сервера",
      description: (
        user: User,
        points: number,
        command: MonitoringCommandIds,
        messageTimestamp: Date,
        lastRemind: RemindDocument | null,
      ) => {
        return unorderedList([
          `Команда: ${chatInputApplicationCommandMention(getCommandNameByCommandId(command)!, command)}`,
          `Поинты: ${bold(`${points} поинтов`)}`,
          `Исполнитель: ${userMention(user.id)}`,
          `Время реакции: ${calculateReactionTime(messageTimestamp, lastRemind?.timestamp ?? new Date())}`,
        ]);
      },
    },
  },
};
