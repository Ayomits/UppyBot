import { Module } from '@nestjs/common';
import { BumpLogModule } from './bump-logs/bump-log-module';
import { BumpUserModule } from './bump-user/bump-user.module';
import { BumpBanModule } from './bump-ban/bump-ban.module';
import { BumpUserCalendarModule } from './bump-user-calendar/bump-user-calendar.module';
import { BumpGuildCalendarModule } from './bump-guild-calendar/bump-guild-calendar.module';

@Module({
  imports: [
    BumpLogModule,
    BumpUserModule,
    BumpUserCalendarModule,
    BumpGuildCalendarModule,
    BumpBanModule,
  ],
})
export class BumpModule {}
