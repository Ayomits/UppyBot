import { Module } from '@nestjs/common';
import { GuildModuleSettings as GuildSettingsModule } from './guild/guild-settings.module';
import { PointSettingsModule } from './point/point-settings.module';

@Module({
  imports: [GuildSettingsModule, PointSettingsModule],
})
export class SettingsModule {}
