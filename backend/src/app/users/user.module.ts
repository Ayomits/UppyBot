import { UserCollectionName, UserSchema } from '#/models/user.model';
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { HttpModule } from '@nestjs/axios';
import { DiscordUrl } from '#/const/url';
import { GuildModule } from '../guilds/guild.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    GuildModule,
    HttpModule.register({
      baseURL: DiscordUrl,
    }),
    MongooseModule.forFeature([
      { name: UserCollectionName, schema: UserSchema },
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [MongooseModule, UserService, UserModule],
})
export class UserModule {}
