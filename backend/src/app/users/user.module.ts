import { UserCollectionName, UserSchema } from '#/models/user.model';
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    HttpModule.register({
      baseURL: 'https://discord.com',
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
