import type { Snowflake, User } from "discord.js";
import {
  bold,
  chatInputApplicationCommandMention,
  roleMention,
  time,
  TimestampStyles,
  unorderedList,
} from "discord.js";
import { DateTime } from "luxon";

import type { RemindDocument } from "#/models/remind.model.js";

import {
  getCommandNameByCommandId,
  type MonitoringCommandIds,
} from "../controllers/reminder/reminder.const.js";

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
        force: number
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
        lastRemind: RemindDocument
      ) => {
        const { years, months, weeks, days, hours, minutes, seconds } =
          DateTime.now().diff(
            DateTime.fromJSDate(lastRemind?.timestamp ?? new Date()),
            ["years", "months", "weeks", "days", "hours", "minutes", "seconds"]
          );

        function format() {
          const toFormat = [];

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

        return unorderedList([
          `Команда: ${chatInputApplicationCommandMention(getCommandNameByCommandId(command), command)}`,
          `Поинты: ${bold(`${points} поинтов`)}`,
          `Исполнитель: ${user}`,
          `Время реакции: ${format()}`,
        ]);
      },
    },
  },
};
