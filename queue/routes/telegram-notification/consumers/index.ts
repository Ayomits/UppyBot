import { parseConsumerData } from "#/queue/utils/parseData.js";
import type { Consumer } from "#/queue/utils/types.js";
import { GuildRepository } from "#/shared/db/repositories/uppy-discord/guild.repository.js";
import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import { logger } from "#/shared/libs/logger/logger.js";
import { WebhookNotificationType } from "#/shared/webhooks/webhook.types.js";
import { telegramApp } from "#/telegram/client.js";
import { Emojis } from "#/telegram/utils/emojis.js";
import { bold, cursive, inlineCode } from "#/telegram/utils/html-markdown.js";

import { telegramSingleNotificationProduce } from "../producers/index.js";
import type {
  TelegramBumpBanNotificationPayload,
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

  logger.info(`Start notify telegram users for guild: ${data.guildId}`);
  logger.info(`Users: ${data.users.length}`);

  try {
    const repository = NotificationUserRepository.create();

    const filter = {
      discord_user_id: { $in: data.users },
      [`notifications.${repository.getNotificationFieldByMonitoring(data.type)}`]: true,
      [`settings.selected_guilds`]: data.guildId,
    };

    const users = await repository.find(filter);

    logger.info(`Found ${users.length} users for notify`);

    for (const user of users) {
      await telegramSingleNotificationProduce({
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
    logger.error(err);
    ch.nack(msg, false, false);
  }
};

export const telegramBumpBanNotificationConsumer: Consumer = async (
  msg,
  ch
) => {
  const data = parseConsumerData<TelegramBumpBanNotificationPayload>(msg);

  try {
    const userRepository = NotificationUserRepository.create();
    const user = await userRepository.findByDiscordId(data?.userId);
    if (user && user?.settings?.bump_ban) {
      const isRemoved = data.type === WebhookNotificationType.BumpBanRemoval;
      const titleAction = isRemoved ? "снят" : "выдан";
      const captionAction = isRemoved
        ? cursive("Теперь ты можешь работать до первого бампа:)")
        : cursive("Чилл-аут, ты был слишком хорош!");
      const guildRepository = GuildRepository.create();
      const guild = await guildRepository.findGuild(data.guildId);
      await telegramSingleNotificationProduce({
        content: [
          `${Emojis.ALARM_CLOCK} ${bold(`Бамп бан ${titleAction}`)}`,
          ``,
          `${Emojis.CASTLE} ${bold("Сервер:")} ${guild.guildName}`,
          `${Emojis.BOW_AND_ARROW}: ${bold("Мысли бота:")} ${captionAction}`,
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
