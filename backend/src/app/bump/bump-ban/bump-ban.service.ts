import { BumpBanLimit } from '#/const/bump-ban';
import { BumpBan, BumpBanCollectionName } from '#/models/bump-ban.model';
import { PaginationResponse } from '#/responses/pagination';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBumpBanDto } from './bump-ban.dto';
import { omit } from '#/lib/omit';

@Injectable()
export class BumpBanService {
  constructor(
    @InjectModel(BumpBanCollectionName) private bumpBanModel: Model<BumpBan>,
  ) {}

  async findUserBumpBan(guildId: string, userId: string) {
    const entry = await this.bumpBanModel.findOne({ guildId, userId });

    if (!entry) {
      throw new NotFoundException();
    }

    return omit((entry as unknown as BumpBan & { _doc: any })._doc, [
      '_id',
      '__v',
      'userId',
      'guildId',
    ]);
  }

  async createBumpBan(dto: CreateBumpBanDto) {
    await Promise.all([
      this.bumpBanModel.findOneAndUpdate(
        { guildId: dto.guildId, userId: dto.userId, type: dto.type },
        {
          $setOnInsert: {
            removeIn: 0,
          },
        },
        {
          upsert: true,
        },
      ),
      this.bumpBanModel.updateMany(
        {
          guildId: dto.guildId,
          userId: { $ne: dto.userId },
        },
        { $inc: { removeIn: 1 } },
      ),
    ]);
  }

  async findActiveBumpBans(guildId: string, offset: number, limit: number) {
    const items = await this.bumpBanModel
      .find({
        guildId,
        removeIn: {
          $lt: BumpBanLimit,
        },
      })
      .skip(offset * limit)
      .limit(limit + 1);

    return new PaginationResponse({
      hasNext: items.length > limit,
      items: items.map((item) =>
        omit((item as unknown as { _doc: any })._doc, [
          '_id',
          'guildId',
          '__v',
          'createdAt',
          'updatedAt',
        ]),
      ),
      limit,
    });
  }

  async findInactiveBumpBans(guildId: string, offset: number, limit: number) {
    const items = await this.bumpBanModel
      .find({
        guildId,
        removeIn: {
          $gte: BumpBanLimit,
        },
      })
      .skip(offset * limit)
      .limit(limit + 1);

    return new PaginationResponse({
      hasNext: items.length > limit,
      items: items.map((item) =>
        omit((item as unknown as { _doc: any })._doc, [
          '_id',
          'guildId',
          '__v',
          'createdAt',
          'updatedAt',
        ]),
      ),
      limit,
    });
  }

  async findBumpBans(guildId: string, offset: number, limit: number) {
    const items = await this.bumpBanModel
      .find({
        guildId,
      })
      .skip(offset * limit)
      .limit(limit + 1);

    return new PaginationResponse({
      hasNext: items.length > limit,
      items: items.map((item) =>
        omit((item as unknown as { _doc: any })._doc, [
          '_id',
          'guildId',
          '__v',
          'createdAt',
          'updatedAt',
        ]),
      ),
      limit,
    });
  }

  async deleteBumpBan(guildId: string, userId: string) {
    const deleted = await this.bumpBanModel.deleteOne({ guildId, userId });

    if (deleted.deletedCount === 0) {
      throw new NotFoundException();
    }
  }

  async deleteInactiveBumpBans(guildId: string, ids: string[]) {
    await this.bumpBanModel.deleteMany({
      guildId,
      userId: { $in: ids },
    });
  }
}
