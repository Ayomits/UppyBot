import type { Message } from "discord.js";
import { inject, injectable } from "tsyringe";

import { MonitoringBot } from "./reminder.const.js";
import { ReminderParser } from "./reminder.parser.js";

@injectable()
export class BumpReminderService {
  constructor(@inject(ReminderParser) private commandParser: ReminderParser) {}

  public async handleCommand(message: Message) {
    if (
      !Object.values(MonitoringBot).includes(message.author.id as MonitoringBot)
    ) {
      return;
    }

    const payload = await this.commandParser.handleMonitoring(message);

    if (!payload) {
      return;
    }

    return message.reply(JSON.stringify(payload));
  }
}
