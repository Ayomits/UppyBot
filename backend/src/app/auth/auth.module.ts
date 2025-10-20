import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../users/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AUTH_TOKEN_EXPIRATION } from './auth.const';
import { JwtAuthGuard } from '#/common/guards/jwt-auth.guard';
import { DiscordModule } from '#/shared/modules/discord/discord.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        signOptions: {
          expiresIn: AUTH_TOKEN_EXPIRATION,
        },
        secret: configService.getOrThrow('JWT_SECRET'),
      }),
    }),
    DiscordModule,
  ],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
