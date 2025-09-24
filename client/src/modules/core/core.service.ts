import { ActivityType } from "discord.js";
import type { Client } from "discordx";
import { injectable } from "tsyringe";

import { scheduleManager } from "#/libs/schedule/schedule.manager.js";

@injectable()
export class CoreService {
  handleReady(client: Client) {
    this.changeStatus(client);
    scheduleManager.startPeriodJob("change_status", 60_000, () =>
      this.changeStatus(client),
    );
  }

  async changeStatus(client: Client) {
    const guilds = await client.guilds.fetch().catch(() => ({
      size: 0,
    }));

    client.user.setActivity(`Работает на ${guilds.size} серверах`, {
      type: ActivityType.Custom,
    });
  }
}
