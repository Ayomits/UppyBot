import {
  PointSettingsCollectionName,
  PointSettingsSchema,
} from '#/models/point-settings.model';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PointSettingsService } from './point-settings.service';
import { PointSettingsController } from './point-settings.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PointSettingsCollectionName,
        schema: PointSettingsSchema,
      },
    ]),
  ],
  providers: [PointSettingsService],
  controllers: [PointSettingsController],
  exports: [PointSettingsService],
})
export class PointSettingsModule {}
