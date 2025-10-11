import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../users/user.module';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AUTH_TOKEN_EXPIRATION } from './auth.const';
import { JwtAuthGuard } from '#/common/guards/jwt-auth.guard';
import { DiscordUrl } from '#/const/url';

@Module({
  imports: [
    forwardRef(() => UserModule),
    HttpModule.register({
      baseURL: DiscordUrl,
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        signOptions: {
          expiresIn: AUTH_TOKEN_EXPIRATION,
        },
        secret: configService.getOrThrow('JWT_SECRET'),
      }),
    }),
  ],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [JwtModule, HttpModule],
})
export class AuthModule {}
