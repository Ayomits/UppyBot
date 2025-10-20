import { GuildCollectionName, GuildSchema } from '#/models/guild-model';
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuildService } from './guild.service';
import { GuildController } from './guild.controller';
import { AuthModule } from '../auth/auth.module';
import { DiscordModule } from '#/shared/modules/discord/discord.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: GuildCollectionName,
        schema: GuildSchema,
      },
    ]),
    forwardRef(() => AuthModule),
    DiscordModule,
  ],
  providers: [GuildService],
  controllers: [GuildController],
  exports: [GuildModule, GuildService, MongooseModule],
})
export class GuildModule {}
