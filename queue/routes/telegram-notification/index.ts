import { logger } from "@typegoose/typegoose/lib/logSettings.js";

import { QueueMessages } from "#/queue/const/index.js";
import { createRoute } from "#/queue/utils/create-route.js";
import { parseConsumerData } from "#/queue/utils/parse-data.js";
import { GuildRepository } from "#/shared/db/repositories/uppy-discord/guild.repository.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { NotificationUserRepository } from "#/shared/db/repositories/uppy-telegram/user.repository.js";
import { WebhookNotificationType } from "#/shared/webhooks/webhook.types.js";
import { telegramApp } from "#/telegram/client.js";
import { Emojis } from "#/telegram/utils/emojis.js";
import { bold, cursive, inlineCode } from "#/telegram/utils/html-markdown.js";

import type {
  TelegramBumpBanNotificationPayload,
  TelegramRemindNotificationsPayload,
  TelegramSingleNotificationPayload,
} from "./types.js";

export const telegramNotificationRoute = createRoute({
  queue: QueueMessages.telegram.notification,
  async consumeCallback(msg) {
    const data = parseConsumerData<TelegramSingleNotificationPayload>(msg);

    await telegramApp.api.sendMessage(data.telegram_id, data.content, {
      parse_mode: data.parse_mode,
    });
  },
});

export const telegramNotificationRemindRoute = createRoute({
  queue: QueueMessages.telegram.remind,
  async consumeCallback(msg) {
    const data = parseConsumerData<TelegramRemindNotificationsPayload>(msg);

    const repository = NotificationUserRepository.create();

    const filter = {
      discord_user_id: { $in: data.users },
      [`notifications.${repository.getNotificationFieldByMonitoring(data.monitoring)}`]: true,
      [`settings.selected_guilds`]: data.guildId,
    };

    const users = await repository.find(filter);

    logger.info(`Found ${users.length} users for notify`);

    const settingsRepository = SettingsRepository.create();
    const settings = await settingsRepository.findGuildSettings(data.guildId);

    for (const user of users) {
      const isForce = data.type === WebhookNotificationType.ForceRemind;
      if (isForce && !user.settings?.allow_force_reminds) {
        continue;
      }

      const actionText = isForce
        ? `Не торопись, команду можно будет выполнить через ${bold(`${settings.force?.seconds ?? 0}`)} секунд`
        : `Пора выполнить команду!`;

      await telegramNotificationRoute.produce({
        content: [
          `${Emojis.ALARM_CLOCK} ${bold("Напоминание")}`,
          ``,
          `${Emojis.CASTLE} ${bold("Сервер:")} ${data.original.guildName}`,
          `${Emojis.KEYBOARD} ${bold("Команда:")} ${inlineCode(data.original.commandName)}`,
          `${Emojis.FOLDER} ${bold("Канал:")} ${inlineCode(`#${data.original.channelName}`)}`,
          ``,
          `${Emojis.STAR} ${actionText}`,
        ].join("\n"),
        parse_mode: "HTML",
        telegram_id: user.telegram_user_id,
      });
    }
  },
});

export const telegramNotificationBumpBanRoute = createRoute({
  queue: QueueMessages.telegram.bumpBan,
  async consumeCallback(msg) {
    const data = parseConsumerData<TelegramBumpBanNotificationPayload>(msg);

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
      await telegramNotificationRoute.produce({
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
  },
});
