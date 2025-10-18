import { Injectable } from '@nestjs/common';
import { GuildService } from '../guilds/guild.service';
import { BumpLogService } from '../bump/bump-logs/bump-log.service';
import { StatsResponse } from './stats.response';

@Injectable()
export class StatsService {
  constructor(
    private guildService: GuildService,
    private bumpLogService: BumpLogService,
  ) {}

  async findPublicStats(): Promise<StatsResponse> {
    const [guild, commands] = await Promise.all([
      this.guildService.countGuilds(),
      this.bumpLogService.countLogs(),
    ]);

    return {
      guilds: guild.count,
      commands: commands.count,
    };
  }
}
