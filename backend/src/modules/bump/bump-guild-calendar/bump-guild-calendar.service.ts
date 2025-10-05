import { normalizePeriod, softPeriod } from '#/lib/time';
import {
  BumpGuildCalendar,
  BumpGuildCalendarCollectionName,
} from '#/models/bump-guild-calendar.model';
import { PaginationResponse } from '#/responses/pagination';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import { Model } from 'mongoose';

@Injectable()
export class BumpGuildCalendarService {
  constructor(
    @InjectModel(BumpGuildCalendarCollectionName)
    private bumpGuildCalendarModel: Model<BumpGuildCalendar>,
  ) {}

  async createCalendar(guildId: string) {
    const { start, end } = normalizePeriod(new Date(), new Date());
    await this.bumpGuildCalendarModel.findOneAndUpdate(
      {
        guildId,
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
    from: Date,
    to: Date,
    limit: number,
    offset: number,
  ) {
    const period = softPeriod(from, to);
    const { start, end } = normalizePeriod(period.start, period.end);

    const filter = {
      guildId,
      timestamp: {
        $gte: start,
        $lte: end,
      },
    };

    const [items, count] = await Promise.all([
      this.bumpGuildCalendarModel
        .find(filter)
        .skip(offset * limit)
        .limit(limit + 1)
        .sort({ timestamp: -1 }),
      this.bumpGuildCalendarModel.countDocuments(filter),
    ]);

    return new PaginationResponse({
      hasNext: items.length > limit,
      items,
      limit,
      count,
    });
  }
}
