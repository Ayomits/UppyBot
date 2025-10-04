import { Module } from '@nestjs/common';
import { BumpUserController } from './bump-user.controller';
import { BumpUserService } from './bump-user.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BumpUserCollectionName,
  BumpUserSchema,
} from '#/models/bump-user.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BumpUserCollectionName, schema: BumpUserSchema },
    ]),
  ],
  controllers: [BumpUserController],
  providers: [BumpUserService],
})
export class BumpUserModule {}
