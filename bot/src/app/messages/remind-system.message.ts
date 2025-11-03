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

import type { RemindDocument } from "#/db/models/remind.model.js";
import { calculateDiffTime } from "#/libs/time/diff.js";

import {
  getCommandNameByCommandId,
  type MonitoringCommandIds,
} from "../controllers/public/reminder/reminder.const.js";

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
        shouldDisplayPoints: boolean,
      ) => {
        return unorderedList(
          [
            `Команда: ${chatInputApplicationCommandMention(getCommandNameByCommandId(command)!, command)}`,
            shouldDisplayPoints ? `Поинты: ${bold(`${points} поинтов`)}` : "",
            `Исполнитель: ${userMention(user.id)}`,
            `Время реакции: ${calculateDiffTime(messageTimestamp, lastRemind?.timestamp ?? new Date())}`,
          ].filter(Boolean),
        );
      },
    },
  },
};
