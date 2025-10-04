import { Module } from '@nestjs/common';
import { BumpLogModule } from './bump-logs/bump-log-module';
import { BumpUserModule } from './bump-user/bump-user.module';

@Module({
  imports: [BumpLogModule, BumpUserModule],
})
export class BumpModule {}
