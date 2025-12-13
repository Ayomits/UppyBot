import type { Client } from "discord.js";
import { inject, injectable } from "tsyringe";

import { AppThemes } from "#/discord/const/themes.js";
import {
  themeSyncGlobal,
  themeSyncRoute,
} from "#/queue/routes/theme-sync/index.js";
import type { Settings } from "#/shared/db/models/uppy-discord/settings.model.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { Time } from "#/shared/libs/time/time.js";

@injectable()
export class ThemingService {
  constructor(
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
  ) {}

  async handleInitLocal(client: Client) {
    const ids = client.guilds.cache.map((g) => g.id);
    const gSettings = (await this.settingsRepository.findMany({
      guildId: { $in: ids },
      "theming.theme": { $ne: AppThemes.Green },
    })) as unknown as Settings[];

    for (const settings of gSettings) {
      const guild = client.guilds.cache.get(settings.guildId);
      themeSyncRoute.produce({
        theme: settings.theming?.theme ?? AppThemes?.Green,
        guildId: guild!.id,
        hasAvatar: !!settings.theming?.avatar,
        hasBanner: !!settings.theming?.banner,
      });
      setInterval(() => {
        this.handleInterval(guild!.id);
      }, Time.minute * 30);
    }
  }

  async handleInterval(guildId: string) {
    const settings = await this.settingsRepository.findGuildSettings(guildId);
    themeSyncRoute.produce({
      theme: settings.theming?.theme ?? AppThemes?.Green,
      guildId: guildId,
      hasAvatar: !!settings.theming?.avatar,
      hasBanner: !!settings.theming?.banner,
    });
  }

  async handleInitGlobal() {
    themeSyncGlobal.produce({});
    setInterval(() => {
      themeSyncGlobal.produce({});
    }, Time.minute * 30);
  }
}
