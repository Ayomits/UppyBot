import type { ParseMode } from "grammy/types";

export type TelegramNotifyPayload = {
  telegram_id: number;
  content: string;
  parse_mode: ParseMode;
};
