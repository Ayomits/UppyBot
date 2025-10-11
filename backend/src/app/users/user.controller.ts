import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '#/types/auth-request';

@Controller('/users')
@ApiTags('Пользователи')
@ApiCookieAuth()
export class UserController {
  constructor(@Inject(UserService) private userService: UserService) {}

  @Get('@me')
  @UseGuards(JwtAuthGuard)
  async findMe(@Req() req: AuthenticatedRequest) {
    return this.userService.findMe(req);
  }

  @Get('@me/guilds')
  @UseGuards(JwtAuthGuard)
  async findGuilds(@Req() req: AuthenticatedRequest) {
    return this.userService.findGuilds(req);
  }
}
