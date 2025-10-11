import { normalizePeriod, softPeriod } from '#/lib/time';
import {
  BumpUserCalendar,
  BumpUserCalendarCollectionName,
} from '#/models/bump-user-calendar.model';
import { PaginationResponse } from '#/responses/pagination';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import { Model } from 'mongoose';

@Injectable()
export class BumpUserCalendarService {
  constructor(
    @InjectModel(BumpUserCalendarCollectionName)
    private bumpUserCalendarModel: Model<BumpUserCalendar>,
  ) {}

  async createCalendar(guildId: string, userId: string) {
    const { start, end } = normalizePeriod(new Date(), new Date());
    await this.bumpUserCalendarModel.findOneAndUpdate(
      {
        guildId,
        userId,
        timestamp: {
          $gte: start,
          $lte: end,
        },
      },
      {
        timestamp: start,
        formatted: DateTime.fromJSDate(start).toFormat('dd.MM.yyyy'),
      },
      {
        upsert: true,
      },
    );
  }

  async findCalendars(
    guildId: string,
    userId: string,
    from: Date,
    to: Date,
    limit: number,
    offset: number,
  ) {
    const period = softPeriod(from, to);
    const { start, end } = normalizePeriod(period.start, period.end);

    const filter = {
      guildId,
      userId,
      timestamp: {
        $gte: start,
        $lte: end,
      },
    };

    const [items, count] = await Promise.all([
      this.bumpUserCalendarModel
        .find(filter)
        .skip(offset * limit)
        .limit(limit + 1)
        .sort({ timestamp: -1 }),
      this.bumpUserCalendarModel.countDocuments(filter),
    ]);

    return new PaginationResponse({
      hasNext: items.length > limit,
      items,
      limit,
      count,
    });
  }
}
