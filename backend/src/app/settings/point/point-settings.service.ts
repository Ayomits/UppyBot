import { PointRate } from '#/const/point-rates';
import { MonitoringType } from '#/enums/monitoring';
import { omit } from '#/lib/omit';
import {
  PointSettings,
  PointSettingsCollectionName,
} from '#/models/point-settings.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdatePointSettingsDto as UpdatePointSettingsDto } from './point-settings.dto';

@Injectable()
export class PointSettingsService {
  constructor(
    @InjectModel(PointSettingsCollectionName)
    private pointSettingsModel: Model<PointSettings>,
  ) {}

  async findSettings(guildId: string) {
    const getFieldFilter = (type: number) => ({
      $arrayElemAt: [
        {
          $filter: {
            input: '$settings',
            as: 'setting',
            cond: {
              $eq: ['$$setting.type', type],
            },
          },
        },
        0,
      ],
    });

    const settings = await this.pointSettingsModel.aggregate([
      {
        $match: {
          guildId,
          type: {
            $in: Object.values(MonitoringType),
          },
        },
      },
      {
        $group: {
          _id: '$guildId',
          settings: {
            $push: {
              type: '$type',
              default: '$default',
              bonus: '$bonus',
            },
          },
        },
      },
      {
        $project: {
          dsMonitoring: getFieldFilter(MonitoringType.DiscordMonitoring),
          sdcMonitoring: getFieldFilter(MonitoringType.SdcMonitoring),
          serverMonitoring: getFieldFilter(MonitoringType.ServerMonitoring),
          disboardMonitoring: getFieldFilter(MonitoringType.DisboardMonitoring),
        },
      },
    ]);
    return omit({ ...this.getDefaultSettings(), ...settings[0] }, ['_id']);
  }

  private getDefaultSettings() {
    return {
      dsMonitoring: PointRate[MonitoringType.DiscordMonitoring],
      sdcMonitoring: PointRate[MonitoringType.SdcMonitoring],
      serverMonitoring: PointRate[MonitoringType.ServerMonitoring],
      disboardMonitoring: PointRate[MonitoringType.DisboardMonitoring],
    };
  }

  async findByType(guildId: string, type: number) {
    const entry = await this.pointSettingsModel
      .findOneAndUpdate(
        {
          guildId,
          type,
        },
        {
          $setOnInsert: {
            guildId,
            type,
            bonus: PointRate[type].bonus,
            default: PointRate[type].default,
          },
        },
        {
          upsert: true,
          new: true,
        },
      )
      .select(['bonus', 'default']);
    return omit((entry as unknown as PointSettings & { _doc: any })._doc, [
      '_id',
      '__v',
    ]);
  }

  async updateSettings(
    guildId: string,
    type: number,
    dto: UpdatePointSettingsDto,
  ) {
    const entry = await this.pointSettingsModel
      .findOneAndUpdate(
        {
          guildId,
          type,
        },
        {
          $set: {
            ...dto,
          },
        },
        {
          upsert: true,
          new: true,
        },
      )
      .select(['bonus', 'default']);
    return omit((entry as unknown as PointSettings & { _doc: any })._doc, [
      '_id',
      '__v',
    ]);
  }
}
