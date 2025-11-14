import { parseConsumerData } from "#/queue/utils/parseData.js";
import type { Consumer } from "#/queue/utils/types.js";
import { telegramApp } from "#/telegram/client.js";

import type { TelegramNotifyPayload } from "../types.js";

export const telegramNotificationConsumer: Consumer = async (msg, ch) => {
  const data = parseConsumerData<TelegramNotifyPayload>(msg);

  try {
    await telegramApp.api.sendMessage(data.telegram_id, data.content, {
      parse_mode: data.parse_mode,
    });
    ch.ack(msg);
  } catch {
    ch.nack(msg, false, false);
  }
};
