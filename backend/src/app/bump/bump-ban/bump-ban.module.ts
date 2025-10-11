import { Module } from '@nestjs/common';
import { BumpBanService } from './bump-ban.service';
import { BumpBanController } from './bump-ban.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BumpBanCollectionName, BumpBanSchema } from '#/models/bump-ban.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: BumpBanCollectionName,
        schema: BumpBanSchema,
      },
    ]),
  ],
  providers: [BumpBanService],
  controllers: [BumpBanController],
  exports: [BumpBanService],
})
export class BumpBanModule {}
