import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserCollectionName } from '#/models/user.model';
import { Model } from 'mongoose';
import { AuthenticatedRequest } from '#/types/auth-request';
import { HttpService } from '@nestjs/axios';
import { pick } from '#/lib/pick';
import { APIGuild, APIUser } from 'discord-api-types/v10';
import {
  getDiscordGuildAvatar,
  getUserAvatar as getDiscordUserAvatar,
} from '#/lib/discord-cdn';
import { GuildService } from '../guilds/guild.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserCollectionName) private userModel: Model<User>,
    private httpService: HttpService,
    private guildService: GuildService,
    private authService: AuthService,
  ) {}

  async createUser(dto: CreateUserDto) {
    return await this.userModel.findOneAndUpdate(
      { discordId: dto.discordId },
      { accessToken: dto.accessToken, refreshToken: dto.refreshToken },
      { upsert: true },
    );
  }

  async findMeDb(discordId: string) {
    return await this.userModel.findOne({ discordId });
  }

  async findMe(req: AuthenticatedRequest) {
    const user = await this.userModel.findOne({
      discordId: req.user.discordId,
    });

    if (!user) {
      throw new NotFoundException('User was deleted, but token still alive');
    }

    const discordUser = await this.findDiscordUser(user.accessToken);

    return {
      ...pick(discordUser.data, ['id', 'username', 'global_name', 'avatar']),
      avatar: getDiscordUserAvatar(discordUser.data),
    };
  }

  async findGuilds(req: AuthenticatedRequest) {
    const user = await this.userModel.findOne({
      discordId: req.user.discordId,
    });

    if (!user) {
      throw new NotFoundException('User was deleted, but token still alive');
    }
    const discordGuilds = await this.findDiscordGuilds(user.accessToken);

    return {
      items: discordGuilds,
    };
  }

  async findDiscordUser(accessToken: string) {
    return await this.httpService.axiosRef.get<APIUser>('/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async findDiscordGuilds(accessToken: string) {
    const guilds = await this.httpService.axiosRef.get<APIGuild[]>(
      '/api/users/@me/guilds',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const dbGuilds = await this.guildService.findUserGuilds(
      guilds.data.map((g) => g.id),
    );

    const dGuildIds = dbGuilds.map((g) => g.guildId);

    return (
      guilds.data
        // @ts-expect-error idk
        .filter((guild) => guild.permissions & 8 || guild.owner)
        .map((guild) => ({
          ...pick(guild, ['name', 'id']),
          icon: getDiscordGuildAvatar(guild),
          invited: dGuildIds.includes(guild.id),
          inviteLink: this.authService.createBotInviteLink(guild.id).url,
        }))
    );
  }
}
