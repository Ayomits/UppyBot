import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/user.service';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AUTH_COOKIE_NAME, AUTH_TOKEN_EXPIRATION } from './auth.const';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    private configService: ConfigService,
    private httpService: HttpService,
    private jwtService: JwtService,
  ) {}

  async callback(code: string, res: Response) {
    const token = await this.httpService.axiosRef.post(
      '/api/oauth2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.configService.getOrThrow('REDIRECT_URI'),
        client_id: this.configService.getOrThrow('CLIENT_ID'),
        client_secret: this.configService.getOrThrow('CLIENT_SECRET'),
        scope: 'guilds identity',
      }),
    );

    if (!token.data) {
      throw new InternalServerErrorException();
    }

    const user = await this.userService.findDiscordUser(
      token.data.access_token,
    );

    if (!user) {
      throw new InternalServerErrorException();
    }

    await this.userService.createUser({
      discordId: user.data.id,
      accessToken: token.data.access_token,
      refreshToken: token.data.refresh_token,
    });

    const jwt = await this.jwtService.signAsync({ discordId: user.data.id });
    res.cookie(AUTH_COOKIE_NAME, jwt, {
      httpOnly: false,
      sameSite: 'strict',
      secure: this.configService.get('APP_ENV', 'dev') === 'prod',
      maxAge: AUTH_TOKEN_EXPIRATION * 1_000, // 7d
    });
    return res.sendStatus(HttpStatus.OK);
  }
}
