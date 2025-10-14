import { Module } from '@nestjs/common';
import { GuildModule } from '../guilds/guild.module';

@Module({
  imports: [GuildModule],
})
export class StatsModule {}
