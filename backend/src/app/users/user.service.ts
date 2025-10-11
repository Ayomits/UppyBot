import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserCollectionName } from '#/models/user.model';
import { Model } from 'mongoose';
import { AuthenticatedRequest } from '#/types/auth-request';
import { HttpService } from '@nestjs/axios';
import { pick } from '#/lib/pick';
import { APIGuild, APIUser } from 'discord-api-types/v10';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserCollectionName) private userModel: Model<User>,
    private httpService: HttpService,
  ) {}

  async createUser(dto: CreateUserDto) {
    return await this.userModel.create(dto);
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

    return pick(discordUser.data, ['id', 'username', 'global_name', 'avatar']);
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

    return (
      guilds.data
        // @ts-expect-error idk
        .filter((guild) => guild.permissions & 8 || guild.owner)
        .map((guild) => pick(guild, ['name', 'icon', 'id']))
    );
  }
}
