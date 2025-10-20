import { Injectable } from '@nestjs/common';
import { SyncGuildsDto } from './guilds.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Guild, GuildCollectionName } from '#/models/guild-model';
import { FilterQuery, Model } from 'mongoose';
import { GuildType } from '#/enums/guild-type';
import { DiscordService } from '#/shared/modules/discord/discord.service';

@Injectable()
export class GuildService {
  constructor(
    @InjectModel(GuildCollectionName) private guildModel: Model<Guild>,
    private discordService: DiscordService,
  ) {}

  async create(id: string) {
    return await this.guildModel.findOneAndUpdate(
      { guildId: id },
      { isActive: true },
      { upsert: true },
    );
  }

  async delete(id: string) {
    return await this.guildModel.findOneAndUpdate(
      { guildId: id },
      { isActive: false },
    );
  }

  async syncGuilds(dto: SyncGuildsDto) {
    const guilds = (
      await this.guildModel.find({ guildId: { $in: dto.ids } })
    ).map((g) => g.guildId);
    const docs: Guild[] = dto.ids
      .filter((g) => !guilds.includes(g))
      .map((g) => ({
        guildId: g,
        isActive: true,
        type: GuildType.Common,
      }));

    await this.guildModel.insertMany(docs);
  }

  async findUserGuilds(ids: string[]) {
    return await this.guildModel
      .find({ guildId: { $in: ids }, isActive: true })
      .select('guildId');
  }

  async countGuilds(filter?: FilterQuery<Guild>) {
    const count = await this.guildModel.countDocuments(filter);
    return {
      count,
    };
  }
}
