import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { BumpUserCalendarService } from './bump-user-calendar.service';
import { BumpUserCalendarFilter } from './bump-user-calendar.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('/bump-user-calendar')
@ApiTags('Бамп.Календари.Пользователей')
export class BumpUserCalendarController {
  constructor(
    @Inject(BumpUserCalendarService)
    private bumpUserCalendarService: BumpUserCalendarService,
  ) {}

  @Post('/:guildId/:userId')
  createUserCalendar(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
  ) {
    return this.bumpUserCalendarService.createCalendar(guildId, userId);
  }

  @Get('/:guildId/:userId')
  findUserCalendar(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
    @Query(new ValidationPipe({ transform: true }))
    qFilter: BumpUserCalendarFilter,
  ) {
    return this.bumpUserCalendarService.findCalendars(
      guildId,
      userId,
      qFilter.from,
      qFilter.to,
      qFilter.limit,
      qFilter.offset,
    );
  }
}
