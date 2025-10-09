import {
  CanActivate,
  ExecutionContext,
  Inject,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class SecretKeyGuard implements CanActivate {
  constructor(@Inject(ConfigService) private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    try {
      const headers = req.headers;
      const authorization = headers.authorization;

      if (!authorization) {
        throw new UnauthorizedException();
      }

      if (authorization !== this.configService.getOrThrow('SECRET_KEY')) {
        throw new UnauthorizedException();
      }

      return true;
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
