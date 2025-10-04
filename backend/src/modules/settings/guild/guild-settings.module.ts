import { Module } from '@nestjs/common';
import { GuildSettingsService } from './guild-settings.service';
import { GuildSettingsController } from './guild-settings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UppySettingsCollectionName,
  UppySettingsSchema,
} from '#/models/guild-settings.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UppySettingsCollectionName,
        schema: UppySettingsSchema,
      },
    ]),
  ],
  controllers: [GuildSettingsController],
  providers: [GuildSettingsService],
})
export class GuildModuleSettings {}
