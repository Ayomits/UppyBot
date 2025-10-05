import {
  BumpUserCalendarCollectionName,
  BumpUserCalendarSchema,
} from '#/models/bump-user-calendar.model';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BumpUserCalendarController } from './bump-user-calendar.controller';
import { BumpUserCalendarService } from './bump-user-calendar.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: BumpUserCalendarCollectionName,
        schema: BumpUserCalendarSchema,
      },
    ]),
  ],
  controllers: [BumpUserCalendarController],
  providers: [BumpUserCalendarService],
})
export class BumpUserCalendarModule {}
