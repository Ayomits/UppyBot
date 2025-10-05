import { Module } from '@nestjs/common';
import { BumpLogModule } from './bump-logs/bump-log-module';
import { BumpUserModule } from './bump-user/bump-user.module';
import { BumpBanModule } from './bump-ban/bump-ban.module';

@Module({
  imports: [BumpLogModule, BumpUserModule, BumpBanModule],
})
export class BumpModule {}
