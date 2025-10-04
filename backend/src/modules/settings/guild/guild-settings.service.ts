import {
  UppySettings,
  UppySettingsCollectionName,
} from '#/models/guild-settings.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateGuildSettingsDto } from './guild-settings.dto';
import { omit } from '#/lib/omit';

@Injectable()
export class GuildSettingsService {
  constructor(
    @InjectModel(UppySettingsCollectionName)
    private guildSettingsModel: Model<UppySettings>,
  ) {}

  async findSettings(guildId: string) {
    const entry = await this.guildSettingsModel.findOneAndUpdate(
      { guildId },
      {},
      { upsert: true, new: true },
    );
    return omit((entry as unknown as UppySettings & { _doc: any })._doc, [
      '_id',
      '__v',
    ]);
  }

  async updateSettings(guildId: string, dto: UpdateGuildSettingsDto) {
    const entry = await this.guildSettingsModel.findOneAndUpdate(
      { guildId },
      { ...dto },
      { upsert: true, new: true },
    );
    return omit((entry as unknown as UppySettings & { _doc: any })._doc, [
      '_id',
      '__v',
    ]);
  }
}
