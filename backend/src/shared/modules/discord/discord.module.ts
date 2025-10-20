import { DiscordUrl } from '#/const/url';
import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { DiscordService } from './discord.service';

@Global()
@Module({
  imports: [
    HttpModule.register({
      baseURL: DiscordUrl,
    }),
  ],
  providers: [DiscordService],
  exports: [HttpModule, DiscordService],
})
export class DiscordModule {}
