import { Module } from '@nestjs/common';
import { BumpUserController } from './bump-user.controller';
import { BumpUserService } from './bump-user.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BumpUserCollectionName,
  BumpUserSchema,
} from '#/models/bump-user.model';
import { PointSettingsModule } from '#/app/settings/point/point-settings.module';
import { BumpBanModule } from '../bump-ban/bump-ban.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BumpUserCollectionName, schema: BumpUserSchema },
    ]),
    PointSettingsModule,
    BumpBanModule,
  ],
  controllers: [BumpUserController],
  providers: [BumpUserService],
})
export class BumpUserModule {}
