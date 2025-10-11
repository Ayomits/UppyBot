import { AUTH_COOKIE_NAME } from '#/app/auth/auth.const';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    const cookieStore = req.cookies;
    const token = cookieStore?.[AUTH_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException(`${AUTH_COOKIE_NAME} not provided`);
    }

    const validate = await this.jwtService.verify(token);

    if (!validate) {
      throw new UnauthorizedException('Token invalid');
    }

    req.user = validate;

    return true;
  }
}
