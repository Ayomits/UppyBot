import { Module } from '@nestjs/common';
import { GuildModule } from '../guilds/guild.module';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { BumpLogModule } from '../bump/bump-logs/bump-log-module';

@Module({
  imports: [GuildModule, BumpLogModule],
  providers: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}
