import { GuildCollectionName, GuildSchema } from '#/models/guild-model';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuildService } from './guild.service';
import { GuildController } from './guild.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: GuildCollectionName,
        schema: GuildSchema,
      },
    ]),
  ],
  providers: [GuildService],
  controllers: [GuildController],
  exports: [GuildModule, GuildService, MongooseModule],
})
export class GuildModule {}
