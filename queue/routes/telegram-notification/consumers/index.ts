import { parseConsumerData } from "#/queue/utils/parseData.js";
import type { Consumer } from "#/queue/utils/types.js";
import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import { telegramApp } from "#/telegram/client.js";
import { Emojis } from "#/telegram/utils/emojis.js";
import { bold, cursive, inlineCode } from "#/telegram/utils/html-markdown.js";

import { telegramSingleNotificationProduce } from "../producers/index.js";
import type {
  TelegramRemindNotificationsPayload,
  TelegramSingleNotificationPayload,
} from "../types.js";

export const telegramSingleNotificationConsumer: Consumer = async (msg, ch) => {
  const data = parseConsumerData<TelegramSingleNotificationPayload>(msg);

  try {
    await telegramApp.api.sendMessage(data.telegram_id, data.content, {
      parse_mode: data.parse_mode,
    });
    ch.ack(msg);
  } catch {
    ch.nack(msg, false, false);
  }
};

export const telegramRemindNotificationConsumer: Consumer = async (msg, ch) => {
  const data = parseConsumerData<TelegramRemindNotificationsPayload>(msg);

  try {
    const repository = NotificationUserRepository.create();

    const filter = {
      discord_user_id: { $in: data.users },
      [`notifications.${repository.getNotificationFieldByMonitoring(data.type)}`]: true,
      [`settings.selected_guilds`]: `${data.guildId}-${data.original.guildName}`,
    };

    const users = await repository.find(filter);

    for (const user of users) {
      telegramSingleNotificationProduce({
        content: [
          `${Emojis.ALARM_CLOCK} ${bold("Напоминание")}`,
          ``,
          `${Emojis.CASTLE} ${bold("Сервер:")} ${data.original.guildName}`,
          `${Emojis.KEYBOARD} ${bold("Команда:")} ${inlineCode(data.original.commandName)}`,
          `${Emojis.FOLDER} ${bold("Канал:")} ${inlineCode(`#${data.original.channelName}`)}`,
          ``,
          `${Emojis.STAR} ${cursive("Пора выполнить команду!")}`,
        ].join("\n"),
        parse_mode: "HTML",
        telegram_id: user.telegram_user_id,
      });
    }

    ch.ack(msg);
  } catch (err) {
    console.error(err);
    ch.nack(msg, false, false);
  }
};
