import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

@Controller('/auth')
@ApiTags('Авторизация.Дискорд')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('signin')
  signin() {
    return this.authService.signin();
  }

  @Get('/discord/callback')
  callback(@Query('code') code: string, @Res() res: any) {
    return this.authService.callback(code, res);
  }

  @Post('logout')
  logout(@Res() res: Response) {
    return this.authService.logout(res);
  }
}
