import { BumpLog, BumpLogCollectionName } from '#/models/bump-log.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { BumpLogFilter, CreateBumpLogDto } from './bump-log.dto';
import { PaginationResponse } from '#/responses/pagination';

@Injectable()
export class BumpLogService {
  constructor(
    @InjectModel(BumpLogCollectionName) private bumpLogModel: Model<BumpLog>,
  ) {}

  async createLog(guildId: string, userId: string, dto: CreateBumpLogDto) {
    const entry = await this.bumpLogModel.create({
      guildId,
      executorId: userId,
      ...dto,
    });
    return {
      _id: entry?.id,
      guildId,
      userId,
      points: dto.points,
      type: dto.type,
    };
  }

  async findGuildLogs(guildId: string, qFilter: BumpLogFilter) {
    const filter: FilterQuery<BumpLog> = this.buildFilter({ guildId }, qFilter);
    const items = await this.findLogs(filter, qFilter.offset, qFilter.limit);
    return new PaginationResponse(items, items.length > qFilter.limit);
  }

  async findUserLogs(guildId: string, userId: string, qFilter: BumpLogFilter) {
    const filter: FilterQuery<BumpLog> = this.buildFilter(
      { guildId, executorId: userId },
      qFilter,
    );
    const items = await this.findLogs(filter, qFilter.offset, qFilter.limit);
    return new PaginationResponse(items, items.length > qFilter.limit);
  }

  private buildFilter(
    base: { guildId: string; executorId?: string },
    qFilter: BumpLogFilter,
  ) {
    const filter: FilterQuery<BumpLog> = base;

    if (typeof qFilter.type !== 'undefined') {
      filter.type = qFilter.type;
    }

    return filter;
  }

  private async findLogs(
    filter: FilterQuery<BumpLog>,
    offset: number,
    limit: number,
  ) {
    return await this.bumpLogModel
      .find(filter)
      .limit(limit + 1)
      .skip(offset * limit)
  }
}
