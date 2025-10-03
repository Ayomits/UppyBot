import { Module } from '@nestjs/common';
import { BumpLogModule } from './bump-logs/bump-log-module';

@Module({
  imports: [BumpLogModule],
})
export class BumpModule {}
