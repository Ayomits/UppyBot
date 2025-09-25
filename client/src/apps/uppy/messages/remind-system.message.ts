import type { Snowflake } from "discord.js";
import {
  bold,
  inlineCode,
  roleMention,
  time,
  TimestampStyles,
} from "discord.js";

import type { MonitoringCommand } from "../controllers/reminder/reminder.const.js";

export const UppyRemindSystemMessage = {
  remind: {
    warning: {
      content: (roles: Snowflake[], command: string) =>
        `${roles.map(roleMention).join(" ")}, у системы сбился таймер для ${command}. Пропишите пожалуйста команду для запуска`,
    },

    force: {
      content: (roles: Snowflake[], command: string, force: number) =>
        `${roles.map(roleMention).join(" ")}, команда ${command} будет доступа ${time(Math.floor((Date.now() + force * 1_000) / 1_000), TimestampStyles.RelativeTime)}`,
    },

    ping: {
      content: (roles: Snowflake[], command: string) =>
        `${roles.map(roleMention).join(" ")}, пора использовать команду ${command}!`,
      embed: {
        title: "Продвижение сервера",
        description: "Самое время для прописания команды мониторинга",
      },
    },
  },

  monitoring: {
    embed: {
      title: "Продвижение сервера",
      description: (points: number, command: MonitoringCommand) =>
        [
          "Большое спасибо, что продвигаете наш сервер на мониторингах",
          `За это действие вы получили: ${bold(`${points} поинтов`)}`,
          `Выполненная команда: ${inlineCode(command)}`,
        ].join("\n"),
    },
  },
};
