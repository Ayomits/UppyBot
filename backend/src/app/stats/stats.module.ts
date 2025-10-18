import { Module } from '@nestjs/common';
import { GuildModule } from '../guilds/guild.module';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [GuildModule],
  providers: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}
