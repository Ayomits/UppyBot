import { MonitoringType } from '#/enums/monitoring';
import { normalizePeriod, softPeriod } from '#/lib/time';
import { BumpUser, BumpUserCollectionName } from '#/models/bump-user.model';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBumpUserDto } from './bump-user.dto';
import { PaginationResponse } from '#/responses/pagination';
import { omit } from '#/lib/omit';
import { PointSettingsService } from '#/modules/settings/point/point-settings.service';
import { BumpBanService } from '../bump-ban/bump-ban.service';

@Injectable()
export class BumpUserService {
  constructor(
    @InjectModel(BumpUserCollectionName) private bumpUserModel: Model<BumpUser>,
    @Inject(PointSettingsService) private pointSettings: PointSettingsService,
    @Inject(BumpBanService) private bumpBanService: BumpBanService,
  ) {}

  private async findBumpUser(
    guildId: string,
    userId: string,
    from: Date,
    to: Date,
  ) {
    const period = softPeriod(new Date(from), new Date(to));
    const { start, end } = normalizePeriod(period.start, period.end);

    const data = await this.bumpUserModel
      .aggregate([
        {
          $match: {
            guildId: guildId,
            userId: userId,
            timestamp: {
              $gte: start,
              $lte: end,
            },
          },
        },
        {
          $group: {
            _id: null,
            disboardMonitoring: { $sum: '$disboardMonitoring' },
            dsMonitoring: { $sum: '$dsMonitoring' },
            sdcMonitoring: { $sum: '$sdcMonitoring' },
            serverMonitoring: { $sum: '$serverMonitoring' },
            points: { $sum: '$points' },
            userId: { $first: '$userId' },
          },
        },
        { $limit: 1 },
      ])
      .exec();

    if (data.length === 0) {
      throw new NotFoundException();
    }

    return omit(data[0], ['_id', '__v', 'userId']);
  }

  async findUserInfo(
    guildId: string,
    userId: string,
    from: Date,
    to: Date,
    withBumpBan: boolean,
  ) {
    const user = await this.findBumpUser(guildId, userId, from, to);
    if (!user) throw new NotFoundException();

    const response = {
      user,
    };

    if (withBumpBan) {
      const bumpBan = await this.bumpBanService
        .findUserBumpBan(guildId, userId)
        .catch(() => null);

      response['bumpBan'] = bumpBan ?? null;
    }

    return response;
  }

  async leaderBoard(
    guildId: string,
    from: Date,
    to: Date,
    limit: number,
    offset: number,
  ) {
    const period = softPeriod(new Date(from), new Date(to));
    const { start, end } = normalizePeriod(period.start, period.end);
    [limit, offset] = [Number(limit), Number(offset)];

    const data = await this.bumpUserModel
      .aggregate([
        {
          $match: {
            guildId: guildId,
            timestamp: {
              $gte: start,
              $lte: end,
            },
          },
        },
        {
          $group: {
            _id: '$userId',
            disboardMonitoring: { $sum: '$disboardMonitoring' },
            dsMonitoring: { $sum: '$dsMonitoring' },
            sdcMonitoring: { $sum: '$sdcMonitoring' },
            serverMonitoring: { $sum: '$serverMonitoring' },
            points: { $sum: '$points' },
          },
        },
        { $limit: limit + 1 },
        { $skip: limit * offset },
        { $sort: { points: -1 } },
      ])
      .exec();

    if (data.length === 0) {
      throw new NotFoundException();
    }

    return omit(
      new PaginationResponse({
        items: data.map((m) =>
          omit({ ...m, userId: m._id }, ['_id', '__v', 'userId']),
        ),
        hasNext: data.length > limit,
        limit: limit,
      }),
      ['limit'],
    );
  }

  async createBumpUser({ guildId, userId, type }: CreateBumpUserDto) {
    const now = new Date();
    const { start, end } = normalizePeriod(now, now);
    const rate = await this.pointSettings.findByType(guildId, type);
    const hours = new Date().getHours();

    let points = rate.default;

    if (hours >= 0 && hours <= 8) {
      points += rate.bonus;
    }

    await this.bumpUserModel.bulkWrite([
      {
        updateOne: {
          filter: {
            guildId,
            userId,
            timestamp: {
              $gte: start,
              $lte: end,
            },
          },
          update: {
            $inc: {
              points: points,
              [this.calculateField(type)!]: 1,
            },
            $setOnInsert: {
              timestamp: start,
              userId: userId,
              guildId: guildId,
            },
          },
          upsert: true,
        },
      },
    ]);
  }

  private calculateField(type: number): keyof BumpUser | null {
    switch (type) {
      case MonitoringType.DiscordMonitoring:
        return 'dsMonitoring';
      case MonitoringType.SdcMonitoring:
        return 'sdcMonitoring';
      case MonitoringType.ServerMonitoring:
        return 'serverMonitoring';
      case MonitoringType.DisboardMonitoring:
        return 'disboardMonitoring';
    }
    return null;
  }
}
