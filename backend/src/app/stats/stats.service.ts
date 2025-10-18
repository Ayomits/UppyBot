import { Injectable } from '@nestjs/common';
import { GuildService } from '../guilds/guild.service';

@Injectable()
export class StatsService {
  constructor(private guildService: GuildService) {}

  async findPublicStats() {
    const [guild] = await Promise.all([this.guildService.countGuilds()]);

    return {
      guilds: guild.count,
    };
  }
}
