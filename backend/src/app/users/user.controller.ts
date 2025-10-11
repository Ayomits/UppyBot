import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '#/types/auth-request';
import { UserGuildsResponse, UserMeResponse } from './user.dto';

@Controller('/users')
@ApiTags('Пользователи')
@ApiCookieAuth()
export class UserController {
  constructor(@Inject(UserService) private userService: UserService) {}

  @Get('@me')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserMeResponse,
  })
  async findMe(@Req() req: AuthenticatedRequest) {
    return this.userService.findMe(req);
  }

  @Get('@me/guilds')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserGuildsResponse,
  })
  async findGuilds(@Req() req: AuthenticatedRequest) {
    return this.userService.findGuilds(req);
  }
}
