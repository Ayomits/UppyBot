import type { MessageCreateOptions, SendableChannels } from "discord.js";

import { discordClient } from "#/discord/client.js";
import { GuildType } from "#/shared/db/models/uppy-discord/guild.model.js";
import { GuildRepository } from "#/shared/db/repositories/uppy-discord/guild.repository.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { getNestedValue } from "#/shared/libs/json/nested.js";

export class AppEventHandler {
  private guildRepository = GuildRepository.create();
  private settingsRepository = SettingsRepository.create();

  protected async sendChannelMessage(
    channelId: string,
    payload: MessageCreateOptions
  ) {
    const channel = (await discordClient.channels
      .fetch(channelId)
      .catch(() => null)) as SendableChannels;

    if (!channel) {
      return;
    }

    try {
      await channel.send(payload);
    } catch (err) {
      console.error(err);
      return;
    }
  }

  /**
   *
   * @param field nested format like translations (dev.remindLogs)
   * @param payload
   */
  protected async devLog(field: string, payload: MessageCreateOptions) {
    const channels = await this.fetchChannels(field);
    for (const channel of channels) {
      this.sendChannelMessage(channel, payload);
    }
  }

  protected async fetchChannels(field: string) {
    const guilds = await this.guildRepository.findMany({
      type: { $gte: GuildType.Developer },
    });

    const settings = await this.settingsRepository.findMany({
      guildId: { $in: guilds.map((g) => g.guildId) },
    });

    const channelIds = await settings
      .filter((s) => getNestedValue(s, field))
      .map((s) => getNestedValue(s, field));

    return channelIds;
  }
}
