import { Module } from '@nestjs/common';
import { BumpLogController } from './bump-log.controller';
import { BumpLogService } from './bump-log.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BumpLogCollectionName, BumpLogSchema } from '#/models/bump-log.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: BumpLogCollectionName,
        schema: BumpLogSchema,
      },
    ]),
  ],
  controllers: [BumpLogController],
  providers: [BumpLogService],
  exports: [MongooseModule, BumpLogService],
})
export class BumpLogModule {}
