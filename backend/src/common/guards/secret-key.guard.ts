import {
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class SecretKeyGuard implements CanActivate {
  constructor(@Inject(ConfigService) private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const headers = req.headers;
    const authorization = headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('No authorization header provided');
    }

    if (authorization !== this.configService.getOrThrow('SECRET_KEY')) {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }
}
