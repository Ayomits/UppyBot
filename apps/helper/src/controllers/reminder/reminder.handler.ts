import type { Message, Snowflake } from "discord.js";
import { injectable } from "tsyringe";

import { MonitoringBot } from "./reminder.const.js";

interface HandlerValue {
  guild: Snowflake;
  author: Snowflake;
  success: boolean;
  timestamp: Date | null;
  shouldReveal: boolean;
}

@injectable()
export class ReminderHandler {
  public handleMonitoring(message: Message) {
    const handlers = {
      [MonitoringBot.DiscordMonitoring]: this.handleDiscordMonitoring,
      [MonitoringBot.SdcMonitoring]: this.handleSdcMonitoring,
      [MonitoringBot.ServerMonitoring]: this.handleServerMonitoring,
    };

    return handlers[message.author.id as MonitoringBot](message);
  }

  private handleSdcMonitoring(message: Message): HandlerValue {
    return {
      timestamp: new Date(),
      success: true,
      shouldReveal: true,
      guild: "",
      author: "",
    };
  }

  private handleServerMonitoring(message: Message): HandlerValue {
    return {
      timestamp: new Date(),
      success: true,
      shouldReveal: true,
      guild: "",
      author: "",
    };
  }

  private handleDiscordMonitoring(message: Message): HandlerValue {
    return {
      timestamp: new Date(),
      success: true,
      shouldReveal: true,
      guild: "",
      author: "",
    };
  }
}
