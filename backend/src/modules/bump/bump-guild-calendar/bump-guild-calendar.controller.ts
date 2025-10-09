import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { BumpGuildCalendarService } from './bump-guild-calendar.service';
import { BumpGuildCalendarFilter } from './bump-guild-calendar.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SecretKeyGuard } from '#/common/guards/secret-key.guard';

@Controller('/bump-guild-calendar')
@ApiTags('Бамп.Календари.Серверы')
@ApiBearerAuth()
@UseGuards(SecretKeyGuard)
export class BumpGuildCalendarController {
  constructor(
    @Inject(BumpGuildCalendarService)
    private bumpGuildCalendarService: BumpGuildCalendarService,
  ) {}

  @Post('/:guildId')
  createGuildCalendar(@Param('guildId') guildId: string) {
    return this.bumpGuildCalendarService.createCalendar(guildId);
  }

  @Get('/:guildId')
  findGuildCalendar(
    @Param('guildId') guildId: string,
    @Query(new ValidationPipe({ transform: true }))
    qFilter: BumpGuildCalendarFilter,
  ) {
    return this.bumpGuildCalendarService.findCalendars(
      guildId,
      qFilter.from,
      qFilter.to,
      qFilter.limit,
      qFilter.offset,
    );
  }
}
