import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BumpGuildCalendarController } from './bump-guild-calendar.controller';
import { BumpGuildCalendarService } from './bump-guild-calendar.service';
import {
  BumpGuildCalendarCollectionName,
  BumpGuildCalendarSchema,
} from '#/models/bump-guild-calendar.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: BumpGuildCalendarCollectionName,
        schema: BumpGuildCalendarSchema,
      },
    ]),
  ],
  controllers: [BumpGuildCalendarController],
  providers: [BumpGuildCalendarService],
})
export class BumpGuildCalendarModule {}
